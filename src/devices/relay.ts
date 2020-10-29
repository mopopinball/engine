import { Coil, DRIVER_TYPES } from "./coil";

/**
 * A toggle relay.
 */
export class Relay extends Coil {
    constructor(number: number, name: string, driverType: DRIVER_TYPES) {
        super(number, name, driverType, null);
    }

    async on(): Promise<void> {
        this.isOn = true;
        this._markDirty();
    }

    toggle(): void {
        if (this.isOn) {
            this.off();
        }
        else {
            this.on();
        }
    }
}
