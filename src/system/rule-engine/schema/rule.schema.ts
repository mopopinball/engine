import { LightState } from "../../devices/light";
import { OutputDeviceType } from "../../devices/output-device-type";
import { Operator } from "../actions/conditional-action";
import { DataOperation } from "../actions/data-action";
import { TimerActionTriggerMode } from "../actions/timer-action-trigger";

export interface RuleSchema {
    id: string;
    metadata?: RuleMetadata;
    autostart: boolean;
    data: DataSchemaType[];
    devices: [LightOutputState | CoilOutputState | SoundOutputState],
    triggers: [SwitchActionTriggerSchema],
    children: RuleSchema[]
}

export interface RuleMetadata {
    name: string;
    description: string;
}

export type DataSchemaType = NumberDataSchema | StringDataSchema;

export interface NumberDataSchema extends DataSchema<number> {
    type: 'number';
    attributes?: {
        isWholeNumber?: boolean,
        resetOnStateStop?: boolean
    }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StringDataSchema extends DataSchema<string> {
    type: 'string';
}

export interface DataSchema<T> {
    id: string;
    value: T;
    attributes?: {
        resetOnStateStop?: boolean
    }
}

export interface OutputDeviceState {
    id: string;
}

export interface LightOutputState extends OutputDeviceState {
    type: OutputDeviceType.LIGHT;
    state: LightState;
    style?: OutputStyle
}

export interface CoilOutputState extends OutputDeviceState {
    type: OutputDeviceType.COIL;
    state: boolean;
}

export interface SoundOutputState extends OutputDeviceState {
    type: OutputDeviceType.SOUND;
    play: boolean;
}

export interface DisplayOutputState extends OutputDeviceState {
    type: OutputDeviceType.DISPLAY;
    state: string;
    style?: OutputStyle
}

export interface OutputStyle {
    [key: string]: string | number | OutputStyle;
}

export type OutputStateType = LightOutputState | CoilOutputState | SoundOutputState | DisplayOutputState;

export enum ActionType {
    DATA = 'data',
    DEVICE = 'device',
    STATE = 'state',
    CONDITION = 'condition',
    NAMED = 'named',
    RANDOM = 'random'
}

export enum TriggerType {
    SWITCH = 'switch',
    ID = 'id',
    TIMER = 'timer'
}

export interface DataActionSchema {
    type: ActionType.DATA;
    dataId: string;
    operation: DataOperation;
    operand: number | string;
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

export type ConditionalActionConditionSchema = ConditionalActionDataConditionSchema | ConditionalActionSwitchConditionSchema;

export interface ConditionalActionSchema {
    type: ActionType.CONDITION;
    condition: ConditionalActionConditionSchema | ConditionalActionConditionSchema[];
    trueTriggerId: string;
    falseTriggerId: string;
}

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

export interface SwitchActionTriggerSchema extends ActionTriggerSchema {
    type: TriggerType.SWITCH;
    holdIntervalMs?: number;
    switchId: string;
}

export interface IdActionTriggerSchema extends ActionTriggerSchema {
    type: TriggerType.ID,
    id: string
}

export interface TimerActionTriggerSchema extends ActionTriggerSchema {
    type: TriggerType.TIMER,
    id: string,
    valueMs: number;
    mode: TimerActionTriggerMode
}

export type ActionSchemaType = DataActionSchema | NamedTriggerActionSchema | DeviceActionSchema | StateActionSchema | ConditionalActionSchema | RandomActionSchema;

export interface ActionTriggerSchema {
    actions: ActionSchemaType[]
}