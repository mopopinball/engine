import { DesiredOutputState } from "../desired-output-state";
import { ActionSchemaType, ActionType } from "../schema/actions.schema";
import { Action } from "./action";
import { ConditionalAction } from "./conditional-action";
import { DataAction } from "./data-action";
import { DeviceAction } from "./device-action";
import { NamedTriggerAction } from "./named-trigger-action";
import { RandomAction } from "./random-action";
import { StateAction } from "./state-action";
import { TimedAction } from "./timed-action";

export class ActionFactory {
    public static create(actionSchema: ActionSchemaType): Action {
        switch (actionSchema.type) {
        case ActionType.DATA:
            return DataAction.fromJSON(actionSchema);
        case ActionType.DEVICE: {
            const action = new DeviceAction(
                DesiredOutputState.constructFromOutputState(actionSchema.state)
            );
            action.designer = actionSchema.designer;
            return action;
        }
        case ActionType.STATE: 
            return StateAction.fromJSON(actionSchema);
        case ActionType.CONDITION:
            return ConditionalAction.fromJSON(actionSchema);
        case ActionType.NAMED:
            return NamedTriggerAction.fromJSON(actionSchema);
        case ActionType.RANDOM:
            return RandomAction.fromJSON(actionSchema);
        case ActionType.TIMED:
            return TimedAction.fromJSON(actionSchema);
        default:
            throw new Error('Not implemented');
        }
    }
}