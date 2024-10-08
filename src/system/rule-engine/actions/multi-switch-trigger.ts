import { MultiSwitchTriggerSchema, TriggerTypeEnum } from "../schema/triggers.schema";
import { SwitchTriggerId } from "./switch-trigger-id";
import { Trigger } from "./trigger";

export class MultiSwitchTrigger extends Trigger {
    constructor(public id: string, public switches: SwitchTriggerId[]) {
        super(TriggerTypeEnum.MULTI_SWITCH);
    }

    static fromJSON(triggerSchema: MultiSwitchTriggerSchema): MultiSwitchTrigger {
        const trigger = new MultiSwitchTrigger(triggerSchema.id, triggerSchema.switches);
        trigger.designer = triggerSchema.designer;
        return trigger;
    }

    toJSON(): MultiSwitchTriggerSchema {
        const convertedBase = super.toJSON();
        return {
            id: this.id,
            type: TriggerTypeEnum.MULTI_SWITCH,
            switches: this.switches,
            actions: convertedBase.actions,
            designer: convertedBase.designer
        };
    }

    toString(): string {
        return `MultiSwitch trigger`;
    }
}
