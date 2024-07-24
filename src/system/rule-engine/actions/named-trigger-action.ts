import { ActionType, NamedTriggerActionSchema} from "../schema/actions.schema";
import { Action } from "./action";

export class NamedTriggerAction extends Action {
    
    constructor(public triggerId: string) {
        super(ActionType.NAMED);
    }

    onAction(): void {
        this.rootEngine.onTrigger(this.triggerId);
    }

    toJSON(): NamedTriggerActionSchema {
        return {
            type: ActionType.NAMED,
            triggerId: this.triggerId,
            designer: this.designer
        };
    }

    static fromJSON(actionSchema: NamedTriggerActionSchema): NamedTriggerAction {
        const action = new NamedTriggerAction(
            actionSchema.triggerId
        );
        action.designer = actionSchema.designer;
        return action;
    }

    public toString(): string {
        return `[Named Trigger] ${this.triggerId}`;
    }
}