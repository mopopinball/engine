import { RuleEngine } from "../rule-engine";
import { ActionType, StateActionSchema } from "../schema/actions.schema";
import { Action } from "./action";

export class StateAction extends Action {
    constructor(public startTargetId: string, public stopTargetId: string
    ) {
        super(ActionType.STATE);
    }
    
    onAction(): void {
        if (this.startTargetId) {
            this.getEngines().get(this.startTargetId).start();
        }
        if (this.stopTargetId) {
            this.getEngines().get(this.stopTargetId).stop();
        }
    }

    public doesEngineExist(targetId: string): boolean {
        if(!targetId) {
            return false;
        }
        // intentionally calls RuleEngine.root here because super.rootEngine is set in handle().
        return RuleEngine.root?.getAllEngines().has(targetId);
    }

    static fromJSON(actionSchema: StateActionSchema): StateAction {
        const action = new StateAction(
            actionSchema.startTargetId,
            actionSchema.stopTargetId
        );

        action.designer = actionSchema.designer;
        return action;
    }

    toJSON(): StateActionSchema {
        return {
            type: ActionType.STATE,
            startTargetId: this.startTargetId,
            stopTargetId: this.stopTargetId,
            designer: this.designer
        }
    }

    toString(): string {
        return `[State Action]: Stop=${this.stopTargetId} Start=${this.startTargetId}`;   
    }

}