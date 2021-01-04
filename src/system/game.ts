import { Coil } from "./devices/coil";
import { DisplaysPic } from "./devices/displays-pic";
import { DriverPic } from "./devices/driver-pic";
import { LightState } from "./devices/light";
import { OutputDevice } from "./devices/output-device";
import { PlayfieldLamp } from "./devices/playfield-lamp";
import { PlayfieldSwitch } from "./devices/playfield-switch";
import { Relay } from "./devices/relay";
import { Sound } from "./devices/sound";
import { Sys80or80ADisplay } from "./display-80-80a";
import { FpsTracker } from "./fps-tracker";
import { HardwareCoilSchema, HardwareConfig } from "./hardware-config.schema";
import { RuleEngine } from "./rule-engine/rule-engine";
import { RuleSchema, TriggerType } from "./rule-engine/schema/rule.schema";
import { SwitchPayload } from "./rule-engine/switch-payload";

import {MessageBroker, EVENTS} from './messages';
// const Maintenance = require('./system/maintenance');
// const Security = require('./system/security');
import { SwitchesPic } from "./devices/switches-pic";
import { logger } from "./logger";
import { GpioPin } from "./devices/gpio-pin";
import { Board } from "./board";
import { PicVersionMessage } from "./devices/pic-version-message";
import { Server } from "./server/server";
import { Security } from "./security";
import { ClientDevice } from "./server/client-device";
import { DriverType } from "./devices/driver-type";
import { CoilType } from "./devices/coil-type";
import { Update } from "./update";
import { OutputDeviceType } from "./devices/output-device-type";
import { LampRole } from "./devices/lamp-role";
import { DipSwitchState } from "./dip-switch-state";
import { SwitchActionTrigger } from "./rule-engine/actions/switch-action-trigger";
// const Server = require('./system/server');

function onUncaughtError(err) {
    const detail = err.stack ? err.stack : JSON.stringify(err);
    logger.error(`${err.message} ${detail}`);
}
process.on('uncaughtException', (err) => onUncaughtError(err));
process.on('unhandledRejection', (reason) => onUncaughtError(reason));

const MS_PER_FRAME = 33; // 30 fps
// 3 ticks = .1 seconds
// 6 ticks = .2s
// 15 ticks = .5s
// 30 ticks = 1s; clock is tick % fps

/**
 * The Mopo Pinball engine.
 */
export class Game {
    // maintenance: any;
    // security: any;
    // server: any;
    displays: Sys80or80ADisplay;
    name: string;
    fpsTracker: FpsTracker;
    ruleEngine: RuleEngine;
    lastPayload: string;
    private switches: Map<string, PlayfieldSwitch> = new Map();
    private switchesByNumber: Map<number, PlayfieldSwitch> = new Map();
    private lamps: Map<string, PlayfieldLamp> = new Map();
    private coils: Map<string, Coil> = new Map();
    private sounds: Map<string, Sound> = new Map();
    private outputDevices: OutputDevice[] = [];
    private dirtyDevices: OutputDevice[] = [];
    board: Board;
    engineDirty: boolean;
    server: Server;

    constructor(private hardwareConfig: HardwareConfig, private gameStateConfig: RuleSchema) {
        if (!hardwareConfig || !gameStateConfig) {
            throw new Error('Required config not provided');
        }
        if (!hardwareConfig.system) {
            throw new Error('No system defined');
        }

        // this.maintenance = new Maintenance();

        // this.security = new Security(this.hardwareConfig.system);

        this.setup();
    }

    setup(): void {
        Security.getInstance().setSystem(this.hardwareConfig.system);

        this.server = new Server();
        this.server.start();

        // Load our hardware config.
        logger.debug('Loading config');
        this._loadConfig();
        if (this.hardwareConfig.system === SystemName.SYS80 || this.hardwareConfig.system === SystemName.SYS80A) {
            this.displays = new Sys80or80ADisplay();
        }
        else {
            throw new Error('Unexpected system type.');
        }

        // init our instance variables.
        this.name = this.gameStateConfig.metadata.name;
        this.fpsTracker = new FpsTracker();

        this.board = Board.getInstance();

        this.onNewRuleSchema(this.gameStateConfig);
        MessageBroker.getInstance().on(EVENTS.NEW_RULE_SCHEMA, (ruleSchema: RuleSchema) => {
            // only act on the incoming message if debug is enabled
            if (this.board.isDebugEnabled()){
                logger.info('Received a new rule engine.');
                this.gameStateConfig = ruleSchema;
                this.onNewRuleSchema(this.gameStateConfig);
            }
        });

        // Setup all message bindings.
        MessageBroker.getInstance().publishRetain('mopo/info/general', JSON.stringify({
            name: 'Mopo Pinball',
            gameName: this.name,
            version: Update.getInstance().getVersion()
        }));
        
        this.updateDeviceMessages();
        MessageBroker.getInstance().on(EVENTS.MATRIX, (payload) => this.onSwitchMatrixEvent(payload));
        MessageBroker.getInstance().subscribe('mopo/devices/+/+/state/update/client', (topic, msg) => {
            const clientDevice: ClientDevice = JSON.parse(msg);
            this.onClientDeviceUpdate(clientDevice);
        });

        this.setupHardware().then(() => {
            SwitchesPic.getInstance().reset();
            this.board.start();
            logger.debug('Starting game loop.');
            this.gameLoop();
        });
    }

    onNewRuleSchema(ruleSchema: RuleSchema): void {
        this.ruleEngine = RuleEngine.load(ruleSchema);
        this.ruleEngine.onDirty(() => this.engineDirty = true);
        const holdSwitches = this.ruleEngine.getHoldSwitchTriggers();
        this.wireUpHoldSwitches(holdSwitches);
        this.ruleEngine.getAllTimerTriggers().forEach((t) => {
            t.eventEmitter.on('tick', () => this.ruleEngine.onTrigger(t.id));
        });
        this.ruleEngine.start();
        this.engineDirty = true;
    }

    wireUpHoldSwitches(holdSwitcheTriggers: SwitchActionTrigger[]): void {
        const allSwitches = Array.from(this.switches.values());
        for(const sw of allSwitches) {
            sw.clearHoldCallbacks();
        }
        
        for(const hs of holdSwitcheTriggers) {
            const matchingSw: PlayfieldSwitch =
                allSwitches.find((sw: PlayfieldSwitch) => sw.id === hs.switchId);
            matchingSw.onPress(
                () => this.ruleEngine.onSwitch(matchingSw.id, hs.holdIntervalMs),
                hs.holdIntervalMs
            );
        }
    }

    onClientDeviceUpdate(clientDevice: ClientDevice): void {
        const device = this.outputDevices.find((od) => od.id === clientDevice.id);
        if (device) {
            if (clientDevice.isOn) {
                device.on();
            }
            else {
                device.off();
            }
        }
    }

    private updateDeviceMessages(): void {
        MessageBroker.getInstance().publishRetain('mopo/devices/lamps/all/state', this.getClientDevicesString(Array.from(this.lamps.values())));
        MessageBroker.getInstance().publishRetain('mopo/devices/coils/all/state', this.getClientDevicesString(Array.from(this.coils.values())));
        MessageBroker.getInstance().publishRetain('mopo/devices/sounds/all/state', this.getClientDevicesString(Array.from(this.sounds.values())));
        MessageBroker.getInstance().publishRetain('mopo/devices/switches/all/state', JSON.stringify(Array.from(this.switches.values())));
    }

    private async setupHardware(): Promise<void> {
        MessageBroker.getInstance().on(EVENTS.PIC_VERSION, (version) => this.onPicVersion(version));
        await SwitchesPic.getInstance().setup();
        await DriverPic.getInstance().setup();
        await DisplaysPic.getInstance().setup();
        await GpioPin.setupSync();
    }

    onSwitchMatrixEvent(payload: SwitchPayload): void {
        const sw = this.switchesByNumber.get(payload.switch);
        if (!sw) {
            logger.warn(`No switch found: ${payload.switch}`);
        }
        else {
            logger.info(`${sw.name}(${sw.number})=${payload.activated}`);
            try {
                //todo: does this fire for activanted and un-activated?
                sw.onChange(payload.activated);
                if (sw.getActive()) {
                    this.ruleEngine.onSwitch(sw.id);
                }
            }
            catch (e) {
                logger.error(`${e.message} ${e.stack}`);
            }
        }
    }

    /**s
     * Updates our output device states based on the states in the rule engine.
     */
    update(): void {
        if (!this.engineDirty) {
            return;
        }

        const devices = this.ruleEngine.getDevices().values();
        for (const desiredState of devices) {
            if (desiredState.type === OutputDeviceType.LIGHT) {
                const lamp = this.lamps.get(desiredState.id);
                if (lamp.getState() !== desiredState.getState()) {
                    lamp.setState(desiredState.getState() as LightState);
                }
            }
            else if (desiredState.type === OutputDeviceType.COIL) {
                const coil = this.coils.get(desiredState.id);
                if (coil instanceof Relay && coil.isRelayOn() && desiredState.getState() === false) {
                    coil.off();
                }
                else if (coil instanceof Relay && !coil.isRelayOn() && desiredState.getState() === true) {
                    coil.on();
                }
                else if (coil instanceof Relay === false && desiredState.getState() === true) {
                    coil.on();
                    desiredState.setState(false); // makes the coil fire once
                }
            }
            else if (desiredState.type === OutputDeviceType.SOUND) {
                const sound = this.sounds.get(desiredState.id);
                if (desiredState.getState() as boolean === true) {
                    sound.on();
                    desiredState.setState(false); // makes the sound play once
                }
            }
        }
        this.engineDirty = false;
    }

    _loadConfig(): void {
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
            .filter((lampEntry) => lampEntry[1].role === LampRole.LAMP)
            .forEach((lampEntry) => {
                const lamp = new PlayfieldLamp(lampEntry[0], lampEntry[1].number, lampEntry[1].role, lampEntry[1].name, LightState.OFF);
                this.lamps.set(lampEntry[0], lamp);
            });

        // Get all lamps designated as coils and all coils and map for direct lookup.
        this.coils.clear();
        Object.entries(this.hardwareConfig.devices.lamps)
            .filter((lampEntry) => lampEntry[1].role === LampRole.COIL)
            .concat(Object.entries(this.hardwareConfig.devices.coils))
            .forEach((coilEntry) => {
                const coilId = coilEntry[0];
                const coil: HardwareCoilSchema = coilEntry[1];
                if (coil.coilType === CoilType.RELAY) {
                    this.coils.set(coilId, new Relay(
                        coilId,
                        coil.number, coil.name, DriverType.LAMP
                    ));
                }
                else if (coil.coilType === CoilType.COIL) {
                    const driverType = coil.role === LampRole.COIL ? DriverType.LAMP : DriverType.COIL;
                    this.coils.set(coilId, new Coil(
                        coilId,
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
                const sound = new Sound(soundEntry[0], soundEntry[1].number, soundEntry[1].description);
                this.sounds.set(soundEntry[0], sound);
            });

        // keep track of all output devices;
        this.outputDevices = this.outputDevices.concat(Array.from(this.lamps.values()));
        this.outputDevices = this.outputDevices.concat(Array.from(this.coils.values()));
        this.outputDevices = this.outputDevices.concat(Array.from(this.sounds.values()));
        for(const od of this.outputDevices) {
            od.onDirty((device) => {
                this.dirtyDevices.push(device);
            });
        }

        const swCount = this.switches.size;
        const lampCount = this.lamps.size;
        const coilCount = this.coils.size;
        const soundCount = this.sounds.size;
        logger.info(`Loaded ${swCount} switches, ${lampCount} lamps, ${coilCount} coils and ${soundCount} sounds.`);
    }

    private async gameLoop(): Promise<void> {
        const start = this.getCurrentTime();
        try {
            this.update();
        }
        catch (e) {
            logger.error(`${e.message} ${e.stack}`);
        }
        try {
            await this.updateDevices();
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

        // Determine how long to wait before executing next loop iteration in order to meet
        // our desired FPS.
        const end = this.getCurrentTime();
        this.fpsTracker.sampleLoopTime(end - start);

        let loopDelay = start + MS_PER_FRAME - end;
        if (loopDelay < 0) {
            loopDelay = 0;
        }
        setTimeout(() => this.gameLoop(), loopDelay);
    }

    private getCurrentTime(): number {
        return new Date().valueOf();
    }

    /**
     * Updates all output devices defined for this game. This includes lights, coils and sounds.
     */
    private async updateDevices(): Promise<void> {
        // check if there is at least one dirty device.
        if (this.dirtyDevices.length === 0) {
            return;
        }

        // we track on vs. off devices seperatly so we can ack them seperatly.
        // this handles a case where a device goes off during an async update() call, and
        // we wouldnt want to ack the device off when we havnt sent that off state
        // to the pic.
        const dirtyOnDevices = this.dirtyDevices.filter((device) => !device.isOnAckd());
        const dirtyOffDevices = this.dirtyDevices.filter((device) => !device.isOffAckd());

        // send the update(s) to the pic.
        const updateSuccess = await DriverPic.getInstance().update(dirtyOnDevices.concat(dirtyOffDevices));
        if (updateSuccess) {
            dirtyOnDevices.forEach((device) => device.ackDirty(true));
            dirtyOffDevices.forEach((device) => device.ackDirty(false));
        }

        // MessageBroker.getInstance().emit(
        //     EVENTS.OUTPUT_DEVICE_CHANGE,
        //     payload
        // );
        // todo: emit this here? what if no game is loaded and we want to see device states.
        this.updateDeviceMessages();
        MessageBroker.getInstance().publish(
            `mopo/devices/anytype/anyid/state/update`,
            this.getClientDevicesString(this.dirtyDevices)
        );

        // clear the array
        for(const don of dirtyOnDevices) {
            this.dirtyDevices.splice(this.dirtyDevices.indexOf(don), 1);    
        }
        for(const doff of dirtyOffDevices) {
            this.dirtyDevices.splice(this.dirtyDevices.indexOf(doff), 1);    
        }
    }

    private getClientDevicesString(devices: OutputDevice[]): string {
        return JSON.stringify(
            devices.map((d) => this.getClientDevice(d))
        );
    }

    private getClientDevice(device: OutputDevice): ClientDevice {
        return {
            id: device.id,
            name: device.name,
            isOn: device.isOn,
            number: device.getNumber(),
            driverType: device instanceof Coil ? device.driverType : null
        };
    }

    async _updateDisplays(): Promise<void> {
        if (this.displays.getHash() !== this.lastPayload) {
            this.lastPayload = this.displays.getHash();
            await DisplaysPic.getInstance().update(this.displays);
        }
    }

    onPicVersion(versionMessage: PicVersionMessage): void {
        logger.debug(`Pic ${versionMessage.pic} version: ${versionMessage.version}`);
        MessageBroker.getInstance()
            .publishRetain(`mopo/pic/${versionMessage.pic}/version`, versionMessage.version);
        // const config = Config.read();
        // const expectedVersion = config.pics[versionMessage.pic].version;
        // if (semver.lt(versionMessage.version, expectedVersion)) {
        // eslint-disable-next-line max-len
        //     logger.warn(`Pic ${versionMessage.pic} is not running the current version ${expectedVersion}. Its running ${versionMessage.version} Please flash ${versionMessage.pic}.`);
        // }
        // else {
        //     logger.info(`Pic ${versionMessage.pic} is running version ${versionMessage.version}`);
        // }
    }
}

export enum SystemName {
    SYS80 = '80',
    SYS80A = '80a',
    SYS80B = '80b'
}