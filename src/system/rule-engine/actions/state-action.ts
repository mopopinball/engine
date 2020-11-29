import { DesiredOutputState } from "../desired-output-state";
import { RuleData } from "../rule-data";
import { RuleEngine } from "../rule-engine";
import { ActionType, StateActionSchema } from "../schema/rule.schema";
import { Action } from "./action";
import { SwitchActionTrigger } from "./switch-action-trigger";

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

    toJSON(): StateActionSchema {
        return {
            type: ActionType.STATE,
            startTargetId: this.startTargetId,
            stopTargetId: this.stopTargetId
        }
    }

}