import { SystemName } from "./game";
import { Utils } from "./utils";

// const Utils = require('./utils');

/**
 * Machine security.
 */
export class Security {
    private pinCode: number;
    private system: SystemName;
    private static instance: Security;

    public static getInstance(): Security {
        if (!Security.instance) {
            Security.instance = new Security();
        }

        return Security.instance;
    }

    setSystem(system: SystemName): void {
        this.system = system;
        this.refreshPinCode();
    }

    // TODO: Call this periodically from somewhere
    refreshPinCode(): void {
        if (this.system === SystemName.SYS80 || this.system === SystemName.SYS80A) {
            this.pinCode = Utils.getRandomInteger(1000, 10000);
        }
        else {
            this.pinCode = Utils.getRandomInteger(1000, 10000);
        }
    }

    hasPinCode(): boolean {
        return !!this.pinCode;
    }

    getPinCode(): number {
        return this.pinCode;
    }
}
