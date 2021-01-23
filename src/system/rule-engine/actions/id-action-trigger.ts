import { IdActionTriggerSchema, TriggerType } from "../schema/rule.schema";
import { ActionTrigger } from "./action-trigger";

export class IdActionTrigger extends ActionTrigger {
    readonly type = TriggerType.ID;
    
    constructor(public readonly id: string) {
        super();
    }

    static fromJSON(triggerSchema: IdActionTriggerSchema): IdActionTrigger {
        return new IdActionTrigger(triggerSchema.id);
    }

    toJSON(): IdActionTriggerSchema {
        const convertedBase = super.toJSON();
        return {
            type: this.type,
            id: this.id,
            actions: convertedBase.actions
        };
    }

    toString(): string {
        return `Id trigger ${this.id}`;
    }
}