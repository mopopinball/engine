import { GpioPin } from "./gpio-pin";
import { Switch } from "./switch";
import {DIR_IN, EDGE_BOTH, on} from 'rpi-gpio';
// const gpio = require('rpi-gpio');

/**
 * An on-pcb switch.
 */
export class BoardSwitch extends Switch {
    private readonly gpioPin: GpioPin; 
    constructor(id: string, private pin: number, activeLow: boolean) {
        super(id, activeLow);
        this.gpioPin = new GpioPin(this.pin, DIR_IN, EDGE_BOTH);
        on('change', (channel, value) => {
            if (channel === this.pin) {
                this.onChange(value);
            }
        });
    }
}
