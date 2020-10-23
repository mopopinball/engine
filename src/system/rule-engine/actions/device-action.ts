import { LampState, PlayfieldLamp2 } from "../../playfieldLamp2";
import { RuleData } from "../rule-data";
import { Action } from "./action";

export class DeviceAction implements Action {
    constructor(private key: string, private state: LampState) {}
    
    handle(data: Map<string, RuleData>, devices: Map<string, PlayfieldLamp2>): void {
        devices.get(this.key).setState(this.state);
    }
}