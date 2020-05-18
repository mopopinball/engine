const logger = require('./system/logger');
const equal = require('deep-equal');
const GameState = require('./game-state');
const {MessageBroker, EVENTS} = require('./system/messages');
const {PlayfieldLamp, LAMP_ROLES} = require('./devices/playfield-lamp');
const {Coil, DRIVER_TYPES} = require('./devices/coil');
const Relay = require('./devices/relay');
const Sound = require('./devices/sound');
const PlayfieldSwitch = require('./devices/playfield-switch');
const DriverPicSingleton = require('./devices/driver-pic');
const DisplaysPicSingleton = require('./devices/displays-pic');
const Maintenance = require('./system/maintenance');
const Setup = require('./system/setup');
const Server = require('./system/server');
const FpsTracker = require('./system/fps-tracker');

function onUncaughtError(err) {
    const detail = err.stack ? err.stack : JSON.stringify(err);
    logger.error(`${err.message} ${detail}`);
}
process.on('uncaughtException', (err) => onUncaughtError(err));
process.on('unhandledRejection', (reason) => onUncaughtError(reason));

const MS_PER_FRAME = 33; // 30 fps

/**
 * The Mopo Pinball engine.
 */
class Game {
    constructor(hardwareConfig, gameStateConfig) {
        if (!hardwareConfig || !gameStateConfig) {
            throw new Error('Required config not provided');
        }
        this.hardwareConfig = hardwareConfig;
        this.gameStateConfig = gameStateConfig;
        this.maintenance = new Maintenance();
        if (!hardwareConfig.system) {
            throw new Error('No system defined');
        }
        this.security = new Security(this.game.system);

        MessageBroker.on(EVENTS.IC1_DIPS, () => this.onSetupComplete());
        this.setup = new Setup();
        this.setup.setup();
    }

    onSetupComplete() {
        this.server = new Server();
        this.server.start();

        // Load our hardware config.
        this._loadConfig(hardwareConfig);
        if (this.hardwareConfig.system === '80' || this.hardwareConfig.system === '80a') {
            this.displays = require('./system/display-80-80a');
        }
        else {
            throw new Error('Unexpected system type.');
        }

        // init our instance variables.
        this.name = hardwareConfig.name;
        this.fpsTracker = new FpsTracker();

        this.callStates = {};
        this.gameState = new GameState(this.name, this.gameStateConfig);

        // Setup all message bindings.
        MessageBroker.publish('mopo/devices/lamps/all/state', JSON.stringify(this.lamps), {retain: true});
        MessageBroker.publish('mopo/devices/coils/all/state', JSON.stringify(this.coils), {retain: true});
        MessageBroker.publish('mopo/devices/sounds/all/state', JSON.stringify(this.sounds), {retain: true});
        MessageBroker.publish('mopo/devices/switches/all/state', JSON.stringify(this.switches), {retain: true});
        MessageBroker.on(EVENTS.MATRIX, (payload) => this.onSwitchMatrixEvent(payload));
    }

    onSwitchMatrixEvent(payload) {
        const sw = this._switchNumbersLookup[payload.switch];
        if (!sw) {
            logger.warn(`No switch found: ${payload.switch}`);
        }
        else {
            logger.info(`${sw.name}(${sw.number})=${payload.activated}`);
            try {
                this.gameState.onAction(sw.id);
            }
            catch (e) {
                logger.error(`${e.message} ${e.stack}`);
            }
        }
    }

    update() {
        const allDeviceIds = this.gameState.getAllDeviceStates();
        allDeviceIds.forEach((id) => {
            const state = this.gameState.getDeviceState(id);
            const device = this.outputDevices[id];
            // only call device if the calling state has changed
            if (this._hasCallStateChanged(id), state) {
                this._callDevice(device, state);
            }
        });
    }

    _hasCallStateChanged(deviceId, state) {
        const currentState = this.callStates[deviceId];
        return !currentState || !equal(currentState, state);
    }

    _callDevice(device, state) {
        for (const entry of Object.entries(state)) {
            device[entry[0]](entry[1]);
        }
        this.callStates[deviceId] = state;
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

        // keep track of all output devices;
        this.outputDevices = Object.assign({}, this.lamps, this.coils, this.sounds);

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

    /**
     * Updates all output devices defined for this game. This includes lights, coils and sounds.
     */
    async _updateDevices() {
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
        const updateSuccess = await DriverPicSingleton.update(Object.values(this.outputDevices));
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
}

module.exports = Game;
