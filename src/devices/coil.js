const {OutputDevice, OUTPUT_DEVICE_TYPES} = require('./output-device');
const logger = require('../system/logger');
const ACTUATION_TYPE = {
    FIRE: 'FIRE',
    ON: 'ON',
    OFF: 'OFF'
};

const DRIVER_TYPES = {
    LAMP: 'lamp',
    COIL: 'coil'
};

/**
 * a coil.
 */
class Coil extends OutputDevice {
    constructor(number, name, driverType, duration) {
        super(OUTPUT_DEVICE_TYPES.COIL);
        this.number = number;
        this.name = name;
        this.driverType = driverType;
        this.duration = duration;
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

module.exports = {Coil, ACTUATION_TYPE, DRIVER_TYPES};
