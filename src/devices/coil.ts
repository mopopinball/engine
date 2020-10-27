import { OutputDevice, OUTPUT_DEVICE_TYPES } from "./output-device";

const logger = require('../system/logger');
export enum ACTUATION_TYPE {
    FIRE,
    ON,
    OFF
};

export enum CoilType {
    COIL = 'coil',
    RELAY = 'relay'
}

export enum DRIVER_TYPES {
    LAMP,
    COIL
};

/**
 * a coil.
 */
export class Coil extends OutputDevice {
    private _autoOffTimeout: NodeJS.Timeout;

    constructor(private number: number, private name: string, private driverType: DRIVER_TYPES, private duration: number) {
        super(OUTPUT_DEVICE_TYPES.COIL);
        this.isOn = false;
        this._autoOffTimeout = null;

        // if (!duration) {
        //     throw new Error('Duration must be positive int in ms.');
        // }
    }

    async on() {
        if (this.isOn) {
            return;
        }
        super.on();
        logger.debug(`Coil: ${this.name} on`);

        return this._autoOff();
    }

    async _autoOff() {
        return new Promise((resolve) => {
            this._autoOffTimeout = setTimeout(() => {
                this.off();
                resolve();
            }, this.duration);
        });
    }

    off() {
        super.off();
        clearTimeout(this._autoOffTimeout);
        logger.debug(`Coil: ${this.name} off`);
    }
}
