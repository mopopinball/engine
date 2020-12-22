import { logger } from "../logger";
import { DriverType } from "./driver-type";
import { OutputDevice } from "./output-device";
import { OutputDeviceType } from "./output-device-type";

export enum ACTUATION_TYPE {
    FIRE,
    ON,
    OFF
}

/**
 * a coil.
 */
export class Coil extends OutputDevice {
    private _autoOffTimeout: NodeJS.Timeout;

    constructor(
        id: string, public readonly number: number, name: string, public readonly driverType: DriverType,
        private readonly duration: number
    ) {
        super(id, name, OutputDeviceType.COIL);
        this.isOn = false;
        this._autoOffTimeout = null;

        // if (!duration) {
        //     throw new Error('Duration must be positive int in ms.');
        // }
    }

    async on(): Promise<void> {
        if (this.isOn) {
            return;
        }
        super.on();
        logger.debug(`Coil: ${this.name} on`);

        return this._autoOff();
    }

    async _autoOff(): Promise<void> {
        return new Promise((resolve) => {
            this._autoOffTimeout = setTimeout(() => {
                this.off();
                resolve();
            }, this.duration);
        });
    }

    off(): void {
        super.off();
        clearTimeout(this._autoOffTimeout);
        logger.debug(`Coil: ${this.name} off`);
    }

    getFiring(): boolean {
        return this.isOn;
    }

    setFiring(firing: boolean): void {
        if (firing) {
            this.on();
        }
        else {
            this.off();
        }
    }

    getNumber(): number {
        return this.number;
    }
}