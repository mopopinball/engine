import { Light, LightState } from "./light";

export enum LAMP_ROLES {
    LAMP = 'lamp',
    COIL = 'coil'
}

/**
 * todo
 */
export class PlayfieldLamp extends Light {
    constructor(id: string, public number: number, private role: LAMP_ROLES, name: string, state: LightState) {
        super(id, name, state);
    }

    on(): void {
        super.on();
        // this._markDirty();
        // this._publish();
    }

    off(): void {
        super.off();
        // this._markDirty();
        // this._publish();
    }

    // _publish(): void {
    //     MessageBroker.publish(`mopo/devices/lamps/${this.number}/state`, this.isOn.toString(), null);
    // }

    getNumber(): number {
        return this.number;
    }
}
