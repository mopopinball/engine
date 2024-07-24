// ALL ACTION SCHEMAS

import { Operator } from "../actions/condition-clause";
import { DataOperation } from "../actions/data-action";
import { DesignerSchema } from "./designer.schema";
import { CoilOutputState, DisplayOutputState, LightOutputState, SoundOutputState } from "./rule.schema";

export enum ActionType {
    DATA = 'data',
    DEVICE = 'device',
    STATE = 'state',
    CONDITION = 'condition',
    NAMED = 'named',
    RANDOM = 'random',
    TIMED = 'timed'
}

export interface DataActionSchema {
    type: ActionType.DATA;
    dataId: string;
    operation?: DataOperation;
    operand?: number | string;
    expression?: string;
    designer: DesignerSchema;
}

export interface DeviceActionSchema {
    type: ActionType.DEVICE;
    state: LightOutputState | CoilOutputState | SoundOutputState | DisplayOutputState;
    designer: DesignerSchema;
}

export interface TimedActionSchema {
    type: ActionType.TIMED,
    id: string,
    steps: {
        intervalMs: number,
        actions: ActionSchemaType[]
    }[]
    designer: DesignerSchema;
}

export interface StateActionSchema {
    type: ActionType.STATE;
    startTargetId: string;
    stopTargetId: string;
    designer: DesignerSchema;
}

export interface ConditionalResultSchema {
    triggerId?: string;
}

export interface ConditionalClauseSchema {
    conditions: ConditionalActionConditionSchema[],
    trueResult: ConditionalResultSchema
}

export interface ConditionalActionSchema {
    type: ActionType.CONDITION;
    condition?: ConditionalActionConditionSchema | ConditionalActionConditionSchema[];
    clauses?: ConditionalClauseSchema[],
    trueTriggerId?: string;
    falseTriggerId?: string;
    falseResult?: ConditionalResultSchema
    designer: DesignerSchema;
}

// Not a "Trigger"
export interface NamedTriggerActionSchema {
    type: ActionType.NAMED;
    triggerId: string;
    designer: DesignerSchema;
}

export interface RandomActionSchema {
    type: ActionType.RANDOM;
    candidates: {
        clause: ConditionalClauseSchema;
        weight?: number;
    }[]
    designer: DesignerSchema;
}

export type ActionSchemaType = DataActionSchema | TimedActionSchema |
    NamedTriggerActionSchema | DeviceActionSchema | StateActionSchema | ConditionalActionSchema | RandomActionSchema;

export type ConditionalActionConditionSchema = ConditionalActionDataConditionSchema | ConditionalActionSwitchConditionSchema;

export interface ConditionalActionDataConditionSchema {
    conditionType: 'data',
    dataId?: string,
    operator?: Operator,
    operand?: number,
    expression?: string
}

export interface ConditionalActionSwitchConditionSchema {
    conditionType: 'switch',
    switchId: string,
    activated: boolean,
}