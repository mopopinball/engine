import { GpioPin } from "./gpio-pin";
import { Light, LightState } from "./light";

const gpio = require('rpi-gpio').promise;

/**
 * An on-borad status led wired to a GPIO pin.
 */
export class StatusLed extends Light {
    private gpioPin: GpioPin;

    constructor(private pin: number, initiallyOn: boolean) {
        super(initiallyOn ? LightState.ON : LightState.OFF);
        if (!pin) {
            throw new Error('Provide a pin value');
        }
        this.gpioPin = new GpioPin(this.pin, gpio.DIR_OUT);
    }

    on(): void {
        super.on();
        // blinking starts too soon
        if (this.gpioPin) {
            this.gpioPin.writeHigh();
        }
    }

    off(): void {
        super.off();
        // blinking starts too soon.
        if (this.gpioPin) {
            this.gpioPin.writeLow();
        }
    }
}
