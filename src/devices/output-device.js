// const logger = require('../util/logger');
const OUTPUT_DEVICE_TYPES = {
    LIGHT: 'LIGHT',
    COIL: 'COIL',
    SOUND: 'SOUND'
};

/**
 * An output device which is controled by the driver PIC.
 */
class OutputDevice {
    constructor(type) {
        if (Object.keys(OUTPUT_DEVICE_TYPES).indexOf(type) < 0) {
            throw new Error('Invalid output object type.');
        }
        this.type = type;
    }

    on() {
        this.isOn = true;
        this._ackOn = null;
    }

    off() {
        this.isOn = false;
        this._ackOff = null;
    }

    _markDirty() {
        // todo used by sound, cleanup
        this.isDirty = true;
        // MessageBroker.emit(EVENTS.OUTPUT_DEVICE_DIRTY, this);
    }

    dirty() {
        return !this._ackOn || !this._ackOff;
    }

    ackDirty(ackOn) {
        // todo used by sound, cleanup
        this.isDirty = false;
        if (ackOn) {
            this._ackOn = true;
        }
        else {
            this._ackOff = true;
        }
    }
}

module.exports = {OutputDevice, OUTPUT_DEVICE_TYPES};
