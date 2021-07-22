import { MultiSwitchTriggerSchema, TriggerType } from "../schema/triggers.schema";
import { SwitchTriggerId } from "./switch-trigger-id";
import { Trigger } from "./trigger";

export class MultiSwitchTrigger extends Trigger {
    readonly type = TriggerType.MULTI_SWITCH;

    constructor(public id: string, public switches: SwitchTriggerId[]) {
        super();
    }

    static fromJSON(triggerSchema: MultiSwitchTriggerSchema): MultiSwitchTrigger {
        return new MultiSwitchTrigger(triggerSchema.id, triggerSchema.switches);
    }

    toJSON(): MultiSwitchTriggerSchema {
        const convertedBase = super.toJSON();
        return {
            id: this.id,
            type: this.type,
            switches: this.switches,
            actions: convertedBase.actions
        };
    }

    toString(): string {
        return `MultiSwitch trigger`;
    }
}
