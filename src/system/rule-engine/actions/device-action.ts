import { DesiredOutputState } from "../desired-output-state";
import { ActionType, DeviceActionSchema } from "../schema/rule.schema";
import { Action } from "./action";

export class DeviceAction extends Action {
    public rollback: DesiredOutputState[] = [];
    constructor(
        private state: DesiredOutputState
    ) {
        super();
    }
    
    onAction(): void {
        const device = this.devices.get(this.state.id);
        this.rollback.push(device);
        device.setState(this.state.getState(), true);
    }

    toJSON(): DeviceActionSchema {
        return {
            type: ActionType.DEVICE,
            state: this.state.toJSON()
        }
    }
}