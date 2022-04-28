import { IdTriggerSchema, TriggerTypeEnum } from "../schema/triggers.schema";
import { Trigger } from "./trigger";

export class IdTrigger extends Trigger {
    readonly type = TriggerTypeEnum.ID;
    
    constructor(public id: string) {
        super();
    }

    static fromJSON(triggerSchema: IdTriggerSchema): IdTrigger {
        return new IdTrigger(triggerSchema.id);
    }

    toJSON(): IdTriggerSchema {
        const convertedBase = super.toJSON();
        return {
            type: this.type,
            id: this.id,
            actions: convertedBase.actions
        };
    }

    toString(): string {
        return `[Id Trigger] ${this.id}`;
    }
}