import { SwitchActionTriggerSchema, TriggerType } from "../schema/rule.schema";
import { Action } from "./action";

export type ActionTriggerType = SwitchActionTrigger;

export abstract class ActionTrigger {
    actions: Action[] = [];
}

export class SwitchActionTrigger extends ActionTrigger {
    readonly type = TriggerType.SWITCH;
    
    constructor(readonly switchId: string, readonly holdIntervalMs?: number) {
        super();
    }

    toJSON(): SwitchActionTriggerSchema {
        return {
            type: this.type,
            switchId: this.switchId,
            holdIntervalMs: this.holdIntervalMs,
            actions: this.actions.map((a) => a.toJSON())
        };
    }
}

