import { SwitchTriggerSchema, TriggerTypeEnum } from "../schema/triggers.schema";
import { DesignerAttributes } from "../designer-attributes";
import { Trigger } from "./trigger";

export class SwitchTrigger extends Trigger {
    // todo: use new type
    constructor(public switchId: string, public holdIntervalMs?: number) {
        super(TriggerTypeEnum.SWITCH);
    }

    static fromJSON(triggerSchema: SwitchTriggerSchema): SwitchTrigger {
        const swt = new SwitchTrigger(triggerSchema.switchId, triggerSchema.holdIntervalMs);
        swt.designer = triggerSchema.designer;
        return swt;
    }

    toJSON(): SwitchTriggerSchema {
        const convertedBase = super.toJSON();
        return {
            type: TriggerTypeEnum.SWITCH,
            switchId: this.switchId,
            holdIntervalMs: this.holdIntervalMs,
            actions: convertedBase.actions,
            designer: convertedBase.designer
        };
    }

    toString(): string {
        return `Switch trigger ${this.switchId} (${this.holdIntervalMs}ms)`;
    }
}

