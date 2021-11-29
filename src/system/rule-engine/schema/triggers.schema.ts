// ALL TRIGGER SCHEMAS

import { ActionSchemaType } from "./actions.schema";

export enum TriggerTypeEnum {
    SWITCH = 'switch',
    MULTI_SWITCH = 'multi-switch',
    ID = 'id',
    TIMER = 'timer'
}

export enum TimerTriggerMode {
    INTERVAL,
    TIMEOUT
}

export interface SwitchTriggerSchema extends TriggerSchema {
    type: TriggerTypeEnum.SWITCH;
    holdIntervalMs?: number;
    switchId: string;
}

export interface MultiSwitchTriggerSchema extends TriggerSchema {
    type: TriggerTypeEnum.MULTI_SWITCH,
    id: string,
    switches: {
        holdIntervalMs?: number,
        switchId: string
    }[]
}

export interface IdTriggerSchema extends TriggerSchema {
    type: TriggerTypeEnum.ID,
    id: string
}

export interface TimerTriggerSchema extends TriggerSchema {
    type: TriggerTypeEnum.TIMER,
    id: string,
    valueMs: number;
    mode: TimerTriggerMode
}

export type TriggerSchemasType = SwitchTriggerSchema | MultiSwitchTriggerSchema | IdTriggerSchema | TimerTriggerSchema;

export interface TriggerSchema {
    actions: ActionSchemaType[]
}