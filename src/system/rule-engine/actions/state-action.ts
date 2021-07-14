import { ActionType, StateActionSchema } from "../schema/actions.schema";
import { Action } from "./action";

export class StateAction extends Action {
    constructor(private startTargetId: string, private stopTargetId: string
    ) {
        super(ActionType.STATE);
    }
    
    onAction(): void {
        if (this.startTargetId) {
            this.engines.get(this.startTargetId).start();
        }
        if (this.stopTargetId) {
            this.engines.get(this.stopTargetId).stop();
        }
    }

    public doesEngineExist(targetId: string): boolean {
        if(!targetId) {
            return false;
        }
        return this.engines?.has(targetId);
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

    toString(): string {
        return `State action: ${this.stopTargetId} -> ${this.startTargetId}`;   
    }

}