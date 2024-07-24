import { IdTriggerSchema, TriggerTypeEnum } from "../schema/triggers.schema";
import { Trigger } from "./trigger";

export class IdTrigger extends Trigger {
    readonly type = TriggerTypeEnum.ID;
    
    constructor(public id: string) {
        super();
    }

    static fromJSON(triggerSchema: IdTriggerSchema): IdTrigger {
        const trigger = new IdTrigger(triggerSchema.id);
        trigger.designer = triggerSchema.designer;
        return trigger;
    }

    toJSON(): IdTriggerSchema {
        const convertedBase = super.toJSON();
        return {
            type: this.type,
            id: this.id,
            actions: convertedBase.actions,
            designer: convertedBase.designer
        };
    }

    toString(): string {
        return `[Id Trigger] ${this.id}`;
    }
}