import { LightState } from "../../devices/light";
import { DesiredOutputState, DesiredOutputStateType } from "../desired-output-state";
import { RuleData } from "../rule-data";
import { RuleEngine } from "../rule-engine";
import { Action } from "./action";

export class DeviceAction extends Action {
    constructor(private state: DesiredOutputState
    ) {
        super();
    }
    
    onAction(): void {
        this.devices.get(this.state.id).setState(this.state.getState());
    }
}