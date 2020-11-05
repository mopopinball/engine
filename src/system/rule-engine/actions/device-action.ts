import { LightState } from "../../../devices/light";
import { DesiredOutputState } from "../desired-output-state";
import { RuleData } from "../rule-data";
import { RuleEngine } from "../rule-engine";
import { Action } from "./action";

export class DeviceAction extends Action {
    constructor(id: string, private key: string, private state: LightState, actions: Map<string, Action>,
        nextCollection: string[]) {
        super(id, actions, nextCollection);
    }
    
    onAction(engines: Map<string, RuleEngine>, data: Map<string, RuleData>, devices: Map<string, DesiredOutputState>): void {
        devices.get(this.key).setState(this.state);
    }
}