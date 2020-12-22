import { LightState } from "../../devices/light";
import { OutputDeviceType } from "../../devices/output-device-type";

export interface RuleSchema {
    id: string;
    metadata?: RuleMetadata;
    autostart: boolean;
    data: DataSchema[];
    devices: [LightOutputState | CoilOutputState | SoundOutputState],
    triggers: [SwitchActionTriggerSchema],
    children: RuleSchema[]
}

export interface RuleMetadata {
    name: string;
    description: string;
}

export interface DataSchema {
    id: string;
    value: number;
}

export interface OutputDeviceState {
    id: string;
}

export interface LightOutputState extends OutputDeviceState {
    type: OutputDeviceType.LIGHT;
    state: LightState;
}

export interface CoilOutputState extends OutputDeviceState {
    type: OutputDeviceType.COIL;
    state: boolean;
}

export interface SoundOutputState extends OutputDeviceState {
    type: OutputDeviceType.SOUND;
    play: boolean;
}

export enum ActionType {
    DATA = 'data',
    DEVICE = 'device',
    STATE = 'state',
    CONDITION = 'condition'
}

export enum TriggerType {
    SWITCH = 'switch'
}

export interface DataActionSchema {
    type: ActionType.DATA;
    dataId: string;
    operation: number;
    operand: number;
}

export interface DeviceActionSchema {
    type: ActionType.DEVICE;
    state: LightOutputState | CoilOutputState | SoundOutputState;
}

export interface StateActionSchema {
    type: ActionType.STATE;
    startTargetId: string;
    stopTargetId: string;
}

export interface ConditionalActionSchema {
    type: ActionType.CONDITION;
    statement: string[];
    trueResult: string;
    falseResult: string;
}

export interface SwitchActionTriggerSchema extends ActionTriggerSchema {
    type: TriggerType.SWITCH;
    holdIntervalMs?: number;
    switchId: string;
}

export type ActionSchemaType = DataActionSchema | DeviceActionSchema | StateActionSchema;

export interface ActionTriggerSchema {
    actions: ActionSchemaType[]
}