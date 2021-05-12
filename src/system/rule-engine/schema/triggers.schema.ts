// ALL TRIGGER SCHEMAS

import { ActionSchemaType, NamedTriggerActionSchema } from "./actions.schema";

export enum TriggerType {
    SWITCH = 'switch',
    ID = 'id',
    TIMER = 'timer'
}

export enum TimerTriggerMode {
    INTERVAL,
    TIMEOUT
}

export interface SwitchTriggerSchema extends TriggerSchema {
    type: TriggerType.SWITCH;
    holdIntervalMs?: number;
    switchId: string;
}

export interface IdTriggerSchema extends TriggerSchema {
    type: TriggerType.ID,
    id: string
}

export interface TimerTriggerSchema extends TriggerSchema {
    type: TriggerType.TIMER,
    id: string,
    valueMs: number;
    mode: TimerTriggerMode
}

export type TriggerSchemasType = SwitchTriggerSchema | IdTriggerSchema | TimerTriggerSchema;

export interface TriggerSchema {
    actions: ActionSchemaType[]
}