import { logger } from "../logger";
import { Action } from "./actions/action";
import { ActionFactory } from "./actions/action-factory";
import { IdTrigger } from "./actions/id-trigger";
import { MultiSwitchTrigger } from "./actions/multi-switch-trigger";
import { SwitchTrigger } from "./actions/switch-trigger";
import { TimerTrigger } from "./actions/timer-trigger";
import { TriggerType } from "./actions/trigger";
import { RuleEngine } from "./rule-engine";
import { TriggerSchemasType, TriggerTypeEnum } from "./schema/triggers.schema";

export class TriggerFactory {

    public static copyTrigger(trigger: TriggerSchemasType, id: string, engine: RuleEngine, index: number): void {
        // TODO: inefficient to deserialized/reserialize
        const deserialized = this.fromJson(trigger);
        if (deserialized instanceof TimerTrigger || deserialized instanceof IdTrigger) {
            deserialized.id = id;
        }
        else if (deserialized instanceof SwitchTrigger) {
            deserialized.switchId = null; // makes it so that the copied trigger is created as new sw trigger
        }
        this.actionsFromJson(trigger, deserialized, engine);
        this.createTrigger(deserialized.toJSON(), engine, index);
    }

    public static createTrigger(triggerSchema: TriggerSchemasType, engine: RuleEngine, index = engine.triggers.length): void {
        // First, find or create the incoming trigger.
        let trigger: TriggerType = null;
        switch(triggerSchema.type) {
        case TriggerTypeEnum.SWITCH: {
            trigger = engine.getSwitchTrigger(triggerSchema.switchId, triggerSchema.holdIntervalMs);
            if (!trigger) {
                trigger = SwitchTrigger.fromJSON(triggerSchema);
                engine.triggers.splice(index, 0, trigger);
            }
            break;
        }
        case TriggerTypeEnum.MULTI_SWITCH: {
            trigger = engine.getTrigger(triggerSchema.id);
            if (!trigger) {
                trigger = MultiSwitchTrigger.fromJSON(triggerSchema);
                engine.triggers.splice(index, 0, trigger);
            }
            break;
        }
        case TriggerTypeEnum.ID: {
            trigger = engine.getTrigger(triggerSchema.id);
            if (!trigger) {
                trigger = IdTrigger.fromJSON(triggerSchema);
                engine.triggers.splice(index, 0, trigger);
            }
            break;
        }
        case TriggerTypeEnum.TIMER: {
            trigger = engine.getTrigger(triggerSchema.id);
            if (!trigger) {
                trigger = TimerTrigger.fromJSON(triggerSchema);
                engine.triggers.splice(index, 0, trigger);
            }
            break;
        }
        default:
            logger.warn('Unexpected trigger type.');
        }

        // Second, create this triggers actions.
        this.actionsFromJson(triggerSchema, trigger, engine);
    }

    private static fromJson(triggerSchema: TriggerSchemasType): TriggerType {
        switch(triggerSchema.type) {
        case TriggerTypeEnum.SWITCH: {
            return SwitchTrigger.fromJSON(triggerSchema);
        }
        case TriggerTypeEnum.MULTI_SWITCH: {
            return MultiSwitchTrigger.fromJSON(triggerSchema);
        }
        case TriggerTypeEnum.ID: {
            return IdTrigger.fromJSON(triggerSchema);
        }
        case TriggerTypeEnum.TIMER: {
            return TimerTrigger.fromJSON(triggerSchema);
        }
        default:
            logger.warn('Unexpected trigger type.');
        }
    }

    private static actionsFromJson(
        triggerSchema: TriggerSchemasType,
        trigger: TriggerType,
        engine: RuleEngine
    ): void {
        let newAction: Action = null;
        for (const actionSchema of triggerSchema.actions) {
            newAction = ActionFactory.create(actionSchema);

            trigger.actions.push(newAction);

            newAction.onDirty(() => {
                engine.emitDirty();
            });
        }
    }
}