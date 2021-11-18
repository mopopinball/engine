// const pins = require('../../pins.json');
import * as pins from '../pins.json';
// const StatusLed = require('../devices/status-led');
// const BoardSwitch = require('../devices/board-switch');
// const {MessageBroker, EVENTS} = require('./messages');
// const OutputDeviceCollection = require('../devices/output-device-collection');
// const logger = require('../system/logger');
// const spawn = require('child_process').spawnSync;

import { BoardSwitch } from "./devices/board-switch";
import OutputDeviceCollection from './devices/output-device-collection';
import { StatusLed } from "./devices/status-led";
import { logger } from './logger';
import { EVENTS, MessageBroker } from "./messages";
import { LightState } from './devices/light';
import { DipSwitchState } from './dip-switch-state';
import { BlinkLightStyle } from './devices/styles/blink-light-style';

/**
 * Manages board IO including status LEDs and dip switch settings.
 */
export class Board {
    private static instance: Board;
    private dipState: DipSwitchState;
    private s1_2: BoardSwitch;
    private s1_6: BoardSwitch;
    private s1_7: BoardSwitch;
    private s1_8: BoardSwitch;
    private errorLed: StatusLed;
    private piLed: StatusLed;
    private nodeLed: StatusLed;
    private shutdownInterval: NodeJS.Timeout;

    static getInstance(): Board {
        if(!Board.instance) {
            Board.instance = new Board();
        }

        return Board.instance;
    }
    
    private constructor() {
        this.errorLed = new StatusLed('D2', pins.D2_Error_Led);
        this.piLed = new StatusLed('D3', pins.D3_Pi_Led);
        this.nodeLed = new StatusLed('D4', pins.D4_Node_Led);
        this.shutdownInterval = null;

        MessageBroker.getInstance().on(EVENTS.WAN_DOWN, () => this.onWanDown());

        const resetSwitch = new BoardSwitch('S3', pins.S3_Shutdown, true);
        resetSwitch.on('change', (value) => {
            // logger.debug(`Shutdown SW: ${value}`);
            // todo: confirm: this implements a "hold for 3 seconds"? if so, move to switch and test.
            if (value) {
                this.shutdownInterval = setTimeout(() => this.onShutdownCommand(), 3000);
            }
            else {
                clearInterval(this.shutdownInterval);
            }
        });
        // resetSwitch.onPress(() => {}, 3000);

        // const wpsSwitch = new BoardSwitch('S1_8', pins.S1_8_Wps, true);
        // MessageBroker.getInstance().on(wpsSwitch.id, (value) => {
        //     logger.debug(`WPS: ${value[0]}`);
        //     // todo, poll for new ip
        // });


        // setup listeners for all dip switches
        this.s1_2 = new BoardSwitch('S1_2', pins.S1_2_Phat_Sound, true);
        this.s1_2.on('change', () => this.publishDipState());
        this.s1_6 = new BoardSwitch('S1_6', pins.S1_6, true); // shares the same pin as S3.
        this.s1_6.on('change', () => this.publishDipState());
        this.s1_7 = new BoardSwitch('S1_7', pins.S1_7_Debug, true);
        this.s1_7.on('change', () => this.publishDipState());
        this.s1_8 = new BoardSwitch('S1_8', pins.S1_8_Wps, true);
        this.s1_8.on('change', () => this.publishDipState());
        MessageBroker.getInstance().on(EVENTS.IC1_DIPS, (state: DipSwitchState) => this.publishDipState(state));
    }

    private publishDipState(ic1State?: DipSwitchState): void {
        if (ic1State) {
            this.dipState = ic1State;
            this.dipState.s1.sw1 = !this.dipState.s1.sw1;
            this.dipState.s1.sw3 = !this.dipState.s1.sw3;
            this.dipState.s1.sw4 = !this.dipState.s1.sw4;
            this.dipState.s1.sw5 = !this.dipState.s1.sw5;
        }
        this.dipState.s1.sw2 = this.s1_2.getActive();
        this.dipState.s1.sw6 = this.s1_6.getActive();
        this.dipState.s1.sw7 = this.s1_7.getActive();
        this.dipState.s1.sw8 = this.s1_8.getActive();

        MessageBroker.getInstance().publishRetain('mopo/devices/dips/all/state', JSON.stringify(this.dipState));
    }

    start(): void {
        // todo: only start this after setup is complete. remove check in status-led
        this.piLed.on();
        this.nodeLed.setStyles([new BlinkLightStyle(1000, LightState.OFF)]);
    }

    onWanDown(): void {
        this.errorLed.on();
        // light error light? enable wpa mode/button
        // to begin WPA setup, move S1-8 ON then OFF. The pins.D3_Pi_Led will begin to blink.
        // Press the WPS button on your router.
        // TODO: How will this work in (corporate?) locations when now WPS button is present/accessable.
    }

    onShutdownCommand(): void {
        logger.info('Shutting down system.');
        // TODO
        this.piLed.setStyles([new BlinkLightStyle(250, LightState.OFF)]);
        // const resp = spawn('shutdown', ['now'], {stdio: 'pipe', encoding: 'utf-8'});
        // logger.debug(JSON.stringify(resp));
    }

    isDebugEnabled(): boolean {
        return true;
    }

    update(): void {
        this.errorLed.update();
        this.piLed.update();
        this.nodeLed.update();
    }

    setError(isError: boolean): void {
        if (isError) {
            this.errorLed.on();
        }
        else {
            this.errorLed.off();
        }
    }
}
