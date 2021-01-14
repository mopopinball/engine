import { ActionType, StateActionSchema } from "../schema/rule.schema";
import { Action } from "./action";

export class StateAction extends Action {
    constructor(private startTargetId: string, private stopTargetId: string
    ) {
        super();
    }
    
    onAction(): void {
        if (this.startTargetId) {
            this.engines.get(this.startTargetId).start();
        }
        if (this.stopTargetId) {
            this.engines.get(this.stopTargetId).stop();
        }
    }

    static fromJSON(actionSchema: StateActionSchema): StateAction {
        return new StateAction(
            actionSchema.startTargetId,
            actionSchema.stopTargetId
        );
    }

    toJSON(): StateActionSchema {
        return {
            type: ActionType.STATE,
            startTargetId: this.startTargetId,
            stopTargetId: this.stopTargetId
        }
    }

}