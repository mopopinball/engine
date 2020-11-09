import { Coil } from "./coil";
import { DriverType } from "./driver-type";

/**
 * A toggle relay.
 */
export class Relay extends Coil {
    constructor(readonly id: string, number: number, name: string, driverType: DriverType) {
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
