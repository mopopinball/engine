// ALL ACTION SCHEMAS

import { Operator } from "../actions/conditional-action";
import { DataOperation } from "../actions/data-action";
import { CoilOutputState, DisplayOutputState, LightOutputState, SoundOutputState } from "./rule.schema";

export enum ActionType {
    DATA = 'data',
    DEVICE = 'device',
    STATE = 'state',
    CONDITION = 'condition',
    NAMED = 'named',
    RANDOM = 'random'
}

export interface DataActionSchema {
    type: ActionType.DATA;
    dataId: string;
    operation?: DataOperation;
    operand?: number | string;
    expression?: string;
}

export interface DeviceActionSchema {
    type: ActionType.DEVICE;
    state: LightOutputState | CoilOutputState | SoundOutputState | DisplayOutputState;
}

export interface StateActionSchema {
    type: ActionType.STATE;
    startTargetId: string;
    stopTargetId: string;
}

export interface ConditionalActionSchema {
    type: ActionType.CONDITION;
    condition: ConditionalActionConditionSchema | ConditionalActionConditionSchema[];
    trueTriggerId: string;
    falseTriggerId: string;
}

// Not a "Trigger"
export interface NamedTriggerActionSchema {
    type: ActionType.NAMED;
    triggerId: string;
}

export interface RandomActionSchema {
    type: ActionType.RANDOM;
    candidates: {
        triggerId: string;
        weight?: number;
    }[]
}

export type ActionSchemaType = DataActionSchema | NamedTriggerActionSchema | DeviceActionSchema | StateActionSchema | ConditionalActionSchema | RandomActionSchema;

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