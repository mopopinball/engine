import { ActionTriggerSchema } from "../schema/rule.schema";
import { Action } from "./action";
import { IdActionTrigger } from "./id-action-trigger";
import { SwitchActionTrigger } from "./switch-action-trigger";
import { TimerActionTrigger } from "./timer-action-trigger";

export type ActionTriggerType = SwitchActionTrigger | IdActionTrigger | TimerActionTrigger;

export abstract class ActionTrigger {
    actions: Action[] = [];

    toJSON(): ActionTriggerSchema {
        return {
            actions: this.actions.map((a) => a.toJSON())
        }
    }
}