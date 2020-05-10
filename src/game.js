const logger = require('./system/logger');
const {MessageBroker, EVENTS} = require('./system/messages');
const {PlayfieldLamp, LAMP_ROLES} = require('./devices/playfield-lamp');
const {Coil, DRIVER_TYPES} = require('./devices/coil');
const Relay = require('./devices/relay');
const Sound = require('./devices/sound');
const PlayfieldSwitch = require('./devices/playfield-switch');
const DriverPicSingleton = require('./devices/driver-pic');
const DisplaysPicSingleton = require('./devices/displays-pic');
// const FrameBasedOperation = require('./engine/frame-based-operation');
const StateMachine = require('javascript-state-machine');
const FpsTracker = require('./system/fps-tracker');
const Test = require('./system/test');
const Attract = require('./system/attract');
const AttractSystem = require('./system/attract-system-contrib');
const STATE_CONSTANTS = require('./system/common-game-state-constants');

const MS_PER_FRAME = 33; // 30 fps

/**
 * Abstract base game.
 * @abstract
 */
class Game extends StateMachine {
    constructor(hardwareConfig, displays, gameSpecificStateMachineConfig = {}) {
        // Construct the full state machine for this game.
        const commonStates = {
            transitions: [
                {
                    name: STATE_CONSTANTS.TRANSITIONS.START_ATTRACT,
                    from: '*',
                    to: STATE_CONSTANTS.STATES.ATTRACT
                },
                {
                    name: STATE_CONSTANTS.TRANSITIONS.START_PLAY,
                    from: STATE_CONSTANTS.STATES.ATTRACT,
                    to: STATE_CONSTANTS.STATES.PLAY
                },
                {
                    name: STATE_CONSTANTS.TRANSITIONS.END_BALL,
                    from: '*',
                    to: '*'
                },
                {
                    name: STATE_CONSTANTS.TRANSITIONS.END_GAME,
                    from: '*',
                    to: STATE_CONSTANTS.STATES.ATTRACT
                },
                {
                    name: STATE_CONSTANTS.TRANSITIONS.ENTER_TEST,
                    from: STATE_CONSTANTS.STATES.ATTRACT,
                    to: STATE_CONSTANTS.STATES.TEST
                }
            ]
        };
        const completeStateMachineConfig = {
            transitions: commonStates.transitions.concat(gameSpecificStateMachineConfig.transitions)
        };
        super(completeStateMachineConfig);
        this.stateHandlers = {};
        this.observe('onAfterTransition', (event) => {
            MessageBroker.emit(EVENTS.ON_GAME_STATE_TRANSITION, event);
            MessageBroker.emit(EVENTS.NEW_GAME_STATE, event.to);
        });

        // Load our hardware config.
        this._loadConfig(hardwareConfig);

        // init our instance variables.
        this.isGameInProgress = false;
        this.displays = displays;
        this.queuedStateTransitions = [];
        this.entities = [];
        this.name = hardwareConfig.name;
        this.fpsTracker = new FpsTracker();
        this.attractContribSystem = new AttractSystem(this.displays);
        this.attract = new Attract();
        this.entities.push(this.attract);
        this.test = new Test(this.displays, this.switches, this.lamps, this.coils, this.sounds);
        this.entities.push(this.test);

        // Setup all message bindings.
        MessageBroker.publish('mopo/devices/lamps/all/state', JSON.stringify(this.lamps), {retain: true});
        MessageBroker.publish('mopo/devices/coils/all/state', JSON.stringify(this.coils), {retain: true});
        MessageBroker.publish('mopo/devices/sounds/all/state', JSON.stringify(this.sounds), {retain: true});
        MessageBroker.publish('mopo/devices/switches/all/state', JSON.stringify(this.switches), {retain: true});
        MessageBroker.on(EVENTS.MATRIX, (payload) => this.onSwitchMatrixEvent(payload));
        MessageBroker.on(EVENTS.GAME_STATE_TRANSITION, (transitionName) => this._gotoState(transitionName));
        MessageBroker.on(EVENTS.ALL_BALLS_PRESENT, () => this.onAllBallsReady());
    }

    onSwitchMatrixEvent(payload) {
        const sw = this._switchNumbersLookup[payload.switch];
        if (!sw) {
            logger.warn(`No switch found: ${payload.switch}`);
        }
        else {
            logger.info(`${sw.name}(${sw.number})=${payload.activated}`);
            try {
                sw.onChange(payload.activated);
                this.onSwitchChange(sw, payload.activated);
            }
            catch (e) {
                logger.error(`${e.message} ${e.stack}`);
            }
        }
    }

    onInvalidTransition(transition, from, to) {
        throw new Error(`Transition ${transition} not allowed from ${from} to ${to}`);
    }

    update() {
        if (this.queuedStateTransitions.length > 0) {
            const newState = this.queuedStateTransitions.shift();
            this._gotoState(newState);
        }
        this.entities.forEach((e) => e.update());
    }

    _gotoState(transitionName) {
        logger.info(`Requested to transition: ${transitionName}`);
        if (this.can(transitionName)) {
            this[transitionName]();
        }
        else {
            logger.debug('cannot apply transition ' + transitionName);
        }
    }

    registerStateHandler(handlerObj) {
        this.stateHandlers[handlerObj.stateName] = handlerObj;
    }

    onTransition(evt) {
        logger.info(`Tranisioning from state "${evt.from}" to "${evt.to}".`);
        if (this.stateHandlers[evt.from]) {
            this.stateHandlers[evt.from].leave(evt);
        }
        if (this.stateHandlers[evt.to]) {
            this.stateHandlers[evt.to].enter(evt);
        }
    }

    setup() {
        this._setupPics();
        this._gameLoop();
    }

    _setupPics() {
        DriverPicSingleton.setup();
        DisplaysPicSingleton.setup();
    }

    _loadConfig(config) {
        // Map switches to obj/dict for direct lookup.
        // Additionally, the switch PIC broadcasts switch activations by switch number.
        // Create a private mapping to facalitate direct lookup for those events.
        this.switches = {};
        this._switchNumbersLookup = {};
        Object.keys(config.devices.switches)
            .forEach((switchId) => {
                const swValue = config.devices.switches[switchId];
                const playfieldSwitch = new PlayfieldSwitch(
                    switchId, swValue.number, swValue.name,
                    process.env.NODE_ENV === 'test' ? 0 : swValue.debounceIntervalMs,
                    swValue.qualifiesPlayfield
                );
                this.switches[switchId] = playfieldSwitch;
                // add the PIC convience lookup.
                this._switchNumbersLookup[swValue.number] = playfieldSwitch;
            });

        this.lamps = {};
        Object.entries(config.devices.lamps)
            .filter((lampEntry) => lampEntry[1].role === LAMP_ROLES.LAMP)
            .forEach((lampEntry) =>
                this.lamps[lampEntry[0]] = new PlayfieldLamp(lampEntry[1].number, lampEntry[1].role, lampEntry[1].name)
            );

        // Get all lamps designated as coils and all coils and map for direct lookup.
        this.coils = {};
        Object.entries(config.devices.lamps)
            .filter((lampEntry) => lampEntry[1].role === LAMP_ROLES.COIL)
            .concat(Object.entries(config.devices.coils))
            .forEach((coilEntry) => {
                const coilId = coilEntry[0];
                const coil = coilEntry[1];
                if (coil.coilType === 'relay') {
                    this.coils[coilId] = new Relay(
                        coil.number, coil.name, DRIVER_TYPES.LAMP
                    );
                }
                else if (coil.coilType === 'coil') {
                    const driverType = coil.role === LAMP_ROLES.COIL ? DRIVER_TYPES.LAMP : DRIVER_TYPES.COIL;
                    this.coils[coilId] = new Coil(
                        coil.number, coil.name, driverType, coil.durationMs || 100
                    );
                }
                else {
                    throw new Error('Invalid coil type: ' + coil.coilType);
                }
            });

        this.sounds = {};
        Object.entries(config.sounds)
            .forEach((soundEntry) =>
                this.sounds[soundEntry[0]] = new Sound(soundEntry[1].number, soundEntry[1].description)
            );

        const swCount = Object.keys(this.switches).length;
        const lampCount = Object.keys(this.lamps).length;
        const coilCount = Object.keys(this.coils).length;
        const soundCount = Object.keys(this.sounds).length;
        logger.info(`Loaded ${swCount} switches, ${lampCount} lamps, ${coilCount} coils and ${soundCount} sounds.`);
    }

    async _gameLoop() {
        const start = this._getCurrentTime();
        try {
            this.update();
        }
        catch (e) {
            logger.error(`${e.message} ${e.stack}`);
        }
        try {
            await this._updateDevices();
        }
        catch (e) {
            logger.error(`${e.message} ${e.stack}`);
        }
        try {
            await this._updateDisplays();
        }
        catch (e) {
            logger.error(`${e.message} ${e.stack}`);
        }

        // determine how long to wait before executing next loop iteration in order to meet
        // our desired FPS.
        const end = this._getCurrentTime();
        this.fpsTracker.sampleLoopTime(end - start);

        let loopDelay = start + MS_PER_FRAME - end;
        if (loopDelay < 0) {
            loopDelay = 0;
        }
        setTimeout(() => this._gameLoop(), loopDelay);
    }

    _getCurrentTime() {
        return new Date().valueOf();
    }

    // global switch handling. Handles high level actions like entering test mode, etc.
    onSwitchChange(sw, activated) {
        // if any entity has a onSwitchChange method, call it.
        this.entities.forEach((entity) => {
            if (entity.onSwitchChange) {
                entity.onSwitchChange(sw, activated);
            }
        });

        if (!activated) {
            return;
        }

        if (this.isGameInProgress && sw === this.switches.PLAY_TEST) {
            this.endGame();
        }
        else if (this.state === 'attract' && sw === this.switches.PLAY_TEST) {
            this.enterTest();
        }
        else if (this.state === 'test' && sw === this.switches.PLAY_TEST) {
            this.startAttract();
        }
    }

    /**
     * Updates all output devices defined for this game. This includes lights, coils and sounds.
     */
    async _updateDevices() {
        const payload = Object.values(this.lamps)
            .concat(Object.values(this.coils))
            .concat(Object.values(this.sounds));

        // check if there is at least one dirty device.
        const dirtyDevices = payload.filter((device) => device.dirty());
        if (dirtyDevices.length === 0) {
            return;
        }
        // we track on vs. off devices seperatly so we can ack them seperatly.
        // this handles a case where a device goes off during an update() call, and
        // we wouldnt want to ack the device off when we havnt sent the off state
        // to the pic.
        const dirtyOnDevices = dirtyDevices.filter((device) => !device._ackOn);
        const dirtyOffDevices = dirtyDevices.filter((device) => !device._ackOff);

        // send the update(s) to the pic.
        const updateSuccess = await DriverPicSingleton.update(payload);
        if (updateSuccess) {
            dirtyOnDevices.forEach((device) => device.ackDirty(true));
            dirtyOffDevices.forEach((device) => device.ackDirty(false));
        }

        // MessageBroker.emit(
        //     EVENTS.OUTPUT_DEVICE_CHANGE,
        //     payload
        // );
        // todo: emit this here? what if no game is loaded and we want to see device states.
        // MessageBroker.publish('mopo/devices/all/state', JSON.stringify(payload));
    }

    async _updateDisplays() {
        if (this.displays.getHash() !== this.lastPayload) {
            this.lastPayload = this.displays.getHash();
            await DisplaysPicSingleton.update(this.displays);
        }
    }

    onAttract(attractContributors = []) {
        // we always include the system/common attract contributors
        this.coils.TILT_RELAY.off();
        this.attract.onAttract([this.attractContribSystem].concat(attractContributors));
        this.displays.setBall('');
        this.isGameInProgress = false;
        this.ballManager.reset();
        this.coils.GAME_OVER_RELAY.off();
        this.switches.REPLAY.on('change', (activated) => {
            if (activated && this.state === 'attract') {
                this.startPlay();
            }
        });
    }

    onLeaveAttract() {
        logger.info('Leaving attract mode.');
        this.attract.onLeaveAttract();
    }

    onPlay() {
        this.scoreComponent.reset();
        this.ballManager.play();
        this.isGameInProgress = true;
        this.displays.onPlay();
    }

    releaseBallWhenReady() {
        MessageBroker.emit(EVENTS.RELEASE_BALL, {whenReady: true});
    }

    onAllBallsReady() {
        this.coils.GAME_OVER_RELAY.on();
    }

    onEndBall() {
    }

    onEndGame() {
        this.ballManager.reset();
    }

    onEnterTest() {
        this.test.start();
    }

    onLeaveTest() {
        this.test.end();
    }

    onSlam() {
        // todo
    }
}

module.exports = Game;
