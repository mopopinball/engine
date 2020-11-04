import { Coil, DRIVER_TYPES } from "./coil";

/**
 * A toggle relay.
 */
export class Relay extends Coil {
    constructor(readonly id, number: number, name: string, driverType: DRIVER_TYPES) {
        super(id, number, name, driverType, null);
    }

    async on(): Promise<void> {
        super.superOn();
    }

    toggle(): void {
        if (this.isOn) {
            this.off();
        }
        else {
            this.on();
        }
    }

    isRelayOn(): boolean {
        return this.isOn;
    }
}
