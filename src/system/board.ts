// const pins = require('../../pins.json');
import * as pins from '../pins.json';
// const StatusLed = require('../devices/status-led');
// const BoardSwitch = require('../devices/board-switch');
// const {MessageBroker, EVENTS} = require('./messages');
// const OutputDeviceCollection = require('../devices/output-device-collection');
// const logger = require('../system/logger');
// const spawn = require('child_process').spawnSync;

import { BoardSwitch } from "../devices/board-switch";
import OutputDeviceCollection from '../devices/output-device-collection';
import { StatusLed } from "../devices/status-led";
import { logger } from './logger';
import { EVENTS, MessageBroker } from "./messages";

/**
 * Manages board IO including status LEDs and dip switch settings.
 */
export class Board {
    errorLed: StatusLed;
    piLed: StatusLed;
    nodeLed: StatusLed;
    ledCollection: OutputDeviceCollection;
    shutdownInterval: NodeJS.Timeout;
    constructor() {
        this.errorLed = new StatusLed(pins.D2_Error_Led, false);
        this.piLed = new StatusLed(pins.D3_Pi_Led, true);
        this.nodeLed = new StatusLed(pins.D4_Node_Led, false);
        this.ledCollection = new OutputDeviceCollection([this.piLed, this.nodeLed]);
        this.shutdownInterval = null;

        MessageBroker.on(EVENTS.WAN_DOWN, () => this.onWanDown());

        const resetSwitch = new BoardSwitch('S3', pins.S3_Shutdown, true);
        resetSwitch.on('change', (value) => {
            // logger.debug(`Shutdown SW: ${value}`);
            if (value) {
                this.shutdownInterval = setTimeout(() => this.onShutdownCommand(), 3000);
            }
            else {
                clearInterval(this.shutdownInterval);
            }
        });

        const wpsSwitch = new BoardSwitch('S1_8', pins.S1_8_Wps, true);
        MessageBroker.on(wpsSwitch.id, (value) => {
            logger.debug(`WPS: ${value}`);
            // todo, poll for new ip
        });
        MessageBroker.on(EVENTS.IC1_DIPS, (value) => {
            logger.debug(JSON.stringify(value));
        });

        MessageBroker.on(EVENTS.SETUP_GPIO_COMPLETE, () => this.onGpioReady());
    }

    onGpioReady(): void {
        // logger.debug('gpppppp');
        this.piLed.on();
        this.nodeLed.on();
    }

    start(): void {
        // todo: only start this after setup is complete. remove check in status-led
        // this.ledCollection.set();
        // this.ledCollection.blink(10000);
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
        // this.nodeLed.blink(400);
        // const resp = spawn('shutdown', ['now'], {stdio: 'pipe', encoding: 'utf-8'});
        // logger.debug(JSON.stringify(resp));
    }
}
