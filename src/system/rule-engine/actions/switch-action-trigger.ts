import { SwitchActionTriggerSchema, TriggerType } from "../schema/rule.schema";
import { ActionTrigger } from "./action-trigger";

export class SwitchActionTrigger extends ActionTrigger {
    readonly type = TriggerType.SWITCH;
    
    constructor(readonly switchId: string, public holdIntervalMs?: number) {
        super();
    }

    static fromJSON(triggerSchema: SwitchActionTriggerSchema): SwitchActionTrigger {
        return new SwitchActionTrigger(triggerSchema.switchId, triggerSchema.holdIntervalMs);
    }

    toJSON(): SwitchActionTriggerSchema {
        const convertedBase = super.toJSON();
        return {
            type: this.type,
            switchId: this.switchId,
            holdIntervalMs: this.holdIntervalMs,
            actions: convertedBase.actions
        };
    }

    toString(): string {
        return `Switch trigger ${this.switchId} (${this.holdIntervalMs}ms)`;
    }
}

