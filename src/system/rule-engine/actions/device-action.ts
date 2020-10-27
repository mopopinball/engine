import { LightState } from "../../../devices/light";
import { PlayfieldLamp } from "../../../devices/playfield-lamp";
import { RuleData } from "../rule-data";
import { Action } from "./action";

export class DeviceAction extends Action {
    constructor(id: string, private key: string, private state: LightState, actions: Map<string, Action>,
        nextCollection: string[]) {
        super(id, actions, nextCollection);
    }
    
    onAction(data: Map<string, RuleData>, devices: Map<string, PlayfieldLamp>): void {
        devices.get(this.key).setState(this.state);
    }
}