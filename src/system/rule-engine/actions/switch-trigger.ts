import { SwitchTriggerSchema, TriggerTypeEnum } from "../schema/triggers.schema";
import { Trigger } from "./trigger";

export class SwitchTrigger extends Trigger {
    readonly type = TriggerTypeEnum.SWITCH;
    
    // todo: use new type
    constructor(public switchId: string, public holdIntervalMs?: number) {
        super();
    }

    static fromJSON(triggerSchema: SwitchTriggerSchema): SwitchTrigger {
        return new SwitchTrigger(triggerSchema.switchId, triggerSchema.holdIntervalMs);
    }

    toJSON(): SwitchTriggerSchema {
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

