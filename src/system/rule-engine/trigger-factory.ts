import { logger } from "../logger";
import { Action } from "./actions/action";
import { ActionFactory } from "./actions/action-factory";
import { IdTrigger } from "./actions/id-trigger";
import { SwitchTrigger } from "./actions/switch-trigger";
import { TimerTrigger } from "./actions/timer-trigger";
import { ActionTriggerType } from "./actions/trigger";
import { RuleEngine } from "./rule-engine";
import { TriggerSchemasType, TriggerType } from "./schema/triggers.schema";

export class TriggerFactory {

    public static copyTrigger(trigger: TriggerSchemasType, id: string, engine: RuleEngine): void {
        // TODO: inefficient to deserialized/reserialize
        const deserialized = this.fromJson(trigger);
        if (deserialized instanceof TimerTrigger || deserialized instanceof IdTrigger) {
            deserialized.id = id;
        }
        this.createTrigger(deserialized.toJSON(), engine);
    }

    public static createTrigger(triggerSchema: TriggerSchemasType, engine: RuleEngine): void {
        // First, find or create the incoming trigger.
        let trigger: ActionTriggerType = null;
        switch(triggerSchema.type) {
            case TriggerType.SWITCH: {
                trigger = engine.getSwitchTrigger(triggerSchema.switchId, triggerSchema.holdIntervalMs);
                if (!trigger) {
                    trigger = SwitchTrigger.fromJSON(triggerSchema);
                    engine.triggers.push(trigger);
                }
                break;
            }
            case TriggerType.ID: {
                trigger = engine.getTrigger(triggerSchema.id);
                if (!trigger) {
                    trigger = IdTrigger.fromJSON(triggerSchema);
                    engine.triggers.push(trigger);
                }
                break;
            }
            case TriggerType.TIMER: {
                trigger = engine.getTrigger(triggerSchema.id);
                if (!trigger) {
                    trigger = TimerTrigger.fromJSON(triggerSchema);
                    engine.triggers.push(trigger);
                }
                break;
            }
            default:
                logger.warn('Unexpected trigger type.');
        }

        // Second, create this triggers actions.
        let newAction: Action = null;
        for (const actionSchema of triggerSchema.actions) {
            newAction = ActionFactory.create(actionSchema);

            trigger.actions.push(newAction);

            newAction.onDirty(() => {
                engine.emitDirty();
            });
        }
    }

    private static fromJson(triggerSchema: TriggerSchemasType): ActionTriggerType {
        switch(triggerSchema.type) {
            case TriggerType.SWITCH: {
                return SwitchTrigger.fromJSON(triggerSchema);
            }
            case TriggerType.ID: {
                return IdTrigger.fromJSON(triggerSchema);
            }
            case TriggerType.TIMER: {
                return TimerTrigger.fromJSON(triggerSchema);
            }
            default:
                logger.warn('Unexpected trigger type.');
        }
    }
}