import { SwitchActionTriggerSchema, TriggerType } from "../schema/rule.schema";
import { Action } from "./action";

export type ActionTriggerType = SwitchActionTrigger;

export abstract class ActionTrigger {
    actions: Action[] = [];
}

export class SwitchActionTrigger extends ActionTrigger {
    readonly type = TriggerType.SWITCH;
    
    constructor(readonly switchId: string) {
        super();
    }

    toJSON() {
        return {
            type: this.type,
            switchId: this.switchId,
            actions: this.actions
        };
    }
}

