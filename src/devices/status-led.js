const gpio = require('rpi-gpio').promise;
const Light = require('./light');
const GpioPin = require('./gpio-pin');

/**
 * An on-borad status led wired to a GPIO pin.
 */
class StatusLed extends Light {
    constructor(pin, initiallyOn) {
        super(initiallyOn);
        if (!pin) {
            throw new Error('Provide a pin value');
        }
        this.pin = pin;
        this._gpioPin = new GpioPin(this.pin, gpio.DIR_OUT);
    }

    on() {
        super.on();
        // blinking starts too soon
        if (this._gpioPin) {
            this._gpioPin.writeHigh();
        }
    }

    off() {
        super.off();
        // blinking starts too soon.
        if (this._gpioPin) {
            this._gpioPin.writeLow();
        }
    }
}

module.exports = StatusLed;
