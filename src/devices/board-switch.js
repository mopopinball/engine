const Switch = require('./switch');
const gpio = require('rpi-gpio');
const GpioPin = require('./gpio-pin');

/**
 * An on-pcb switch.
 */
class BoardSwitch extends Switch {
    constructor(id, pin, activeLow) {
        super(id, activeLow);
        this.pin = pin;
        this._gpioPin = new GpioPin(this.pin, gpio.DIR_IN, gpio.EDGE_BOTH);
        gpio.on('change', (channel, value) => {
            if (channel === this.pin) {
                this.onChange(value);
            }
        });
    }
}

module.exports = BoardSwitch;
