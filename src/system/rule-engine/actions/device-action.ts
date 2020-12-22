import { DesiredOutputState } from "../desired-output-state";
import { ActionType, DeviceActionSchema } from "../schema/rule.schema";
import { Action } from "./action";

export class DeviceAction extends Action {
    constructor(private state: DesiredOutputState
    ) {
        super();
    }
    
    onAction(): void {
        this.devices.get(this.state.id).setState(this.state.getState());
    }

    toJSON(): DeviceActionSchema {
        return {
            type: ActionType.DEVICE,
            state: this.state.toJSON()
        }
    }
}