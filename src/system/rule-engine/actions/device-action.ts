import { LightState } from "../../devices/light";
import { DesiredOutputState } from "../desired-output-state";
import { RuleData } from "../rule-data";
import { RuleEngine } from "../rule-engine";
import { Action } from "./action";

export class DeviceAction extends Action {
    constructor(private key: string, private state: LightState
    ) {
        super();
    }
    
    onAction(): void {
        this.devices.get(this.key).setState(this.state);
    }
}