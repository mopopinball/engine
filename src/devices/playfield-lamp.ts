import { MessageBroker } from "../system/messages";
import { Light, LightState } from "./light";

export enum LAMP_ROLES {
    LAMP = 'lamp',
    COIL = 'coil'
}

/**
 * todo
 */
export class PlayfieldLamp extends Light {
    constructor(public number: number, private role: LAMP_ROLES, private name: string, state: LightState) {
        super(state);
        this.number = number;
        this.role = role;
        this.name = name;
    }

    on() {
        super.on();
        // this._markDirty();
        // this._publish();
    }

    off() {
        super.off();
        // this._markDirty();
        // this._publish();
    }

    _publish() {
        MessageBroker.publish(`mopo/devices/lamps/${this.number}/state`, this.isOn.toString(), null);
    }
}
