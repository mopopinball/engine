import { ActionType, NamedTriggerActionSchema } from "../schema/rule.schema";
import { Action } from "./action";

export class NamedTriggerAction extends Action {
    
    constructor(public triggerId: string) {
        super();
    }

    onAction(): void {
        this.rootEngine.onTrigger(this.triggerId);
    }

    toJSON(): NamedTriggerActionSchema {
        return {
            type: ActionType.NAMED,
            triggerId: this.triggerId
        };
    }

    static fromJSON(actionSchema: NamedTriggerActionSchema): NamedTriggerAction {
        return new NamedTriggerAction(
            actionSchema.triggerId
        );
    }

    public toString(): string {
        return `[Named Trigger] ${this.triggerId}`;
    }
}