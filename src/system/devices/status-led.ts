import { GpioPin } from "./gpio-pin";
import { Light, LightState } from "./light";
import{DIR_OUT} from 'rpi-gpio';

/**
 * An on-borad status led wired to a GPIO pin.
 */
export class StatusLed extends Light {
    private gpioPin: GpioPin;

    constructor(id: string, private pin: number) {
        super(id, id, LightState.OFF);
        this.gpioPin = new GpioPin(this.pin, DIR_OUT);
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
