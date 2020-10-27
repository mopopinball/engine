import { Coil, CoilType, DRIVER_TYPES } from "./devices/coil";
import { LightState } from "./devices/light";
import { LAMP_ROLES, PlayfieldLamp } from "./devices/playfield-lamp";
import { PlayfieldSwitch } from "./devices/playfield-switch";
import { Relay } from "./devices/relay";
import { Sound } from "./devices/sound";
import { Sys80or80ADisplay } from "./system/display-80-80a";
import { FpsTracker } from "./system/fps-tracker";
import { CoilsSchema, HardwareCoilSchema, HardwareConfig, HardwareSwitchSchema } from "./system/hardware-config.schema";
import { RuleEngine } from "./system/rule-engine/rule-engine";
import { RuleSchema } from "./system/rule-engine/schema/rule.schema";

const logger = require('./system/logger');
const equal = require('deep-equal');
const { MessageBroker, EVENTS } = require('./system/messages');
const DriverPicSingleton = require('./devices/driver-pic');
const DisplaysPicSingleton = require('./devices/displays-pic');
// const Maintenance = require('./system/maintenance');
// const Security = require('./system/security');
const Setup = require('./system/setup');
// const Server = require('./system/server');

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
export class Game {
    hardwareConfig: HardwareConfig;
    // gameStateConfig: RuleSchema;
    // maintenance: any;
    // security: any;
    // setup: any;
    // server: any;
    displays: any;
    name: any;
    fpsTracker: any;
    // callStates: {};
    ruleEngine: RuleEngine;
    // _switchNumbersLookup: any;
    // outputDevices: any;
    lastPayload: any;
    private switches: Map<string, PlayfieldSwitch> = new Map();
    private switchesByNumber: Map<number, PlayfieldSwitch> = new Map();
    private lamps: Map<number, PlayfieldLamp> = new Map();
    private coils: Map<string, Coil> = new Map();
    private sounds: Map<number, Sound> = new Map();
    setup: any;

    constructor(hardwareConfig: HardwareConfig, private gameStateConfig: RuleSchema) {
        if (!hardwareConfig || !gameStateConfig) {
            throw new Error('Required config not provided');
        }
        this.hardwareConfig = hardwareConfig;
        // this.maintenance = new Maintenance();
        if (!hardwareConfig.system) {
            throw new Error('No system defined');
        }
        // this.security = new Security(this.hardwareConfig.system);

        MessageBroker.on(EVENTS.IC1_DIPS, () => this.onSetupComplete());
        this.setup = new Setup();
        this.setup.setup();
    }

    onSetupComplete() {
        // this.server = new Server();
        // this.server.start();

        // Load our hardware config.
        this._loadConfig();
        if (this.hardwareConfig.system === SystemName.SYS80 || this.hardwareConfig.system === SystemName.SYS80A) {
            this.displays = new Sys80or80ADisplay();
        }
        else {
            throw new Error('Unexpected system type.');
        }

        // init our instance variables.
        this.name = this.hardwareConfig.name;
        this.fpsTracker = new FpsTracker();

        // this.callStates = {};
        this.ruleEngine = RuleEngine.load(this.gameStateConfig);
        this.ruleEngine.start();

        // Setup all message bindings.
        MessageBroker.publish('mopo/devices/lamps/all/state', JSON.stringify(this.lamps), { retain: true });
        MessageBroker.publish('mopo/devices/coils/all/state', JSON.stringify(this.coils), { retain: true });
        MessageBroker.publish('mopo/devices/sounds/all/state', JSON.stringify(this.sounds), { retain: true });
        MessageBroker.publish('mopo/devices/switches/all/state', JSON.stringify(this.switches), { retain: true });
        MessageBroker.on(EVENTS.MATRIX, (payload) => this.onSwitchMatrixEvent(payload));

        this._setupPics();
        this._gameLoop();
    }

    onSwitchMatrixEvent(payload) {
        const sw = this.switchesByNumber.get(payload.switch);
        if (!sw) {
            logger.warn(`No switch found: ${payload.switch}`);
        }
        else {
            logger.info(`${sw.name}(${sw.number})=${payload.activated}`);
            try {
                // this.gameState.onAction(sw.id);
                this.ruleEngine.onSwitch(sw.id);
            }
            catch (e) {
                logger.error(`${e.message} ${e.stack}`);
            }
        }
    }

    update() {
        // const allDeviceIds = this.gameState.getAllDeviceStates();
        const devices = this.ruleEngine.getDevices();
        // devices.forEach((device) => {
        //     device
        //     // const state = this.gameState.getDeviceState(id);
        //     const device = this.outputDevices[id];
        //     // only call device if the calling state has changed
        //     if (this._hasCallStateChanged(id, state)) {
        //         this._callDevice(id, device, state);
        //     }
        // });
    }

    // _hasCallStateChanged(deviceId, state) {
    //     const currentState = this.callStates[deviceId];
    //     return !currentState || !equal(currentState, state);
    // }

    _callDevice(id, device, state) {
        for (const entry of Object.entries(state)) {
            logger.debug(`Calling ${id}.${entry[0]}(${entry[1]})`);
            device[entry[0]](entry[1]);
        }
        // this.callStates[id] = state;
    }

    // setup() {
    //     this._setupPics();
    //     this._gameLoop();
    // }

    _setupPics() {
        DriverPicSingleton.setup();
        DisplaysPicSingleton.setup();
    }

    _loadConfig() {
        // Map switches to obj/dict for direct lookup.
        // Additionally, the switch PIC broadcasts switch activations by switch number.
        // Create a private mapping to facalitate direct lookup for those events.
        this.switches.clear();
        this.switchesByNumber.clear();
        for (const switchEntry of Object.entries(this.hardwareConfig.devices.switches)) {
            const playfieldSwitch = new PlayfieldSwitch(
                switchEntry[0], switchEntry[1].number, switchEntry[1].name,
                process.env.NODE_ENV === 'test' ? 0 : switchEntry[1].debounceIntervalMs,
                switchEntry[1].qualifiesPlayfield
            );
            this.switches.set(playfieldSwitch.id, playfieldSwitch);
            // add the PIC convience lookup.
            this.switchesByNumber.set(playfieldSwitch.number, playfieldSwitch);
        }

        this.lamps.clear();
        Object.entries(this.hardwareConfig.devices.lamps)
            .filter((lampEntry) => lampEntry[1].role === LAMP_ROLES.LAMP)
            .forEach((lampEntry) => {
                const lamp = new PlayfieldLamp(lampEntry[1].number, lampEntry[1].role, lampEntry[1].name, LightState.OFF);
                this.lamps.set(lamp.number, lamp);
            });

        // Get all lamps designated as coils and all coils and map for direct lookup.
        this.coils.clear();
        Object.entries(this.hardwareConfig.devices.lamps)
            .filter((lampEntry) => lampEntry[1].role === LAMP_ROLES.COIL)
            .concat(Object.entries(this.hardwareConfig.devices.coils))
            .forEach((coilEntry) => {
                const coilId = coilEntry[0];
                const coil: HardwareCoilSchema = coilEntry[1];
                if (coil.coilType === CoilType.RELAY) {
                    this.coils.set(coilId, new Relay(
                        coil.number, coil.name, DRIVER_TYPES.LAMP
                    ));
                }
                else if (coil.coilType === CoilType.COIL) {
                    const driverType = coil.role === LAMP_ROLES.COIL ? DRIVER_TYPES.LAMP : DRIVER_TYPES.COIL;
                    this.coils.set(coilId, new Coil(
                        coil.number, coil.name, driverType, coil.durationMs || 100
                    ));
                }
                else {
                    throw new Error('Invalid coil type: ' + coil.coilType);
                }
            });

        this.sounds.clear();
        Object.entries(this.hardwareConfig.sounds)
            .forEach((soundEntry) => {
                const sound = new Sound(soundEntry[1].number, soundEntry[1].description);
                this.sounds.set(sound.number, sound);
            });

        // // keep track of all output devices;
        // this.outputDevices = Object.assign({}, this.lamps, this.coils, this.sounds);

        const swCount = this.switches.size;
        const lampCount = this.lamps.size;
        const coilCount = this.coils.size;
        const soundCount = this.sounds.size;
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
        // const dirtyDevices = Object.values(this.outputDevices).filter((device) => device.dirty());
        // if (dirtyDevices.length === 0) {
        //     return;
        // }
        // we track on vs. off devices seperatly so we can ack them seperatly.
        // this handles a case where a device goes off during an update() call, and
        // we wouldnt want to ack the device off when we havnt sent the off state
        // to the pic.
        // const dirtyOnDevices = dirtyDevices.filter((device) => !device._ackOn);
        // const dirtyOffDevices = dirtyDevices.filter((device) => !device._ackOff);

        // send the update(s) to the pic.
        // const updateSuccess = await DriverPicSingleton.update(Object.values(this.outputDevices));
        // if (updateSuccess) {
        //     dirtyOnDevices.forEach((device) => device.ackDirty(true));
        //     dirtyOffDevices.forEach((device) => device.ackDirty(false));
        // }

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

export enum SystemName {
    SYS80 = '80',
    SYS80A = '80a',
    SYS80B = '80b'
}