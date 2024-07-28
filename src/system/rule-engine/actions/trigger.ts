import { TriggerSchema } from "../schema/triggers.schema";
import { Action } from "./action";
import { DesignerAttributes } from "../designer-attributes";
import { IdTrigger } from "./id-trigger";
import { MultiSwitchTrigger } from "./multi-switch-trigger";
import { SwitchTrigger } from "./switch-trigger";
import { TimerTrigger } from "./timer-trigger";

export type TriggerType = SwitchTrigger | MultiSwitchTrigger | IdTrigger | TimerTrigger;

export abstract class Trigger {
    actions: Action[] = [];
    designer: DesignerAttributes;

    toJSON(): TriggerSchema {
        return {
            actions: this.actions.map((a) => a.toJSON()),
            designer: this.designer
        }
    }

    abstract toString(): string;
}