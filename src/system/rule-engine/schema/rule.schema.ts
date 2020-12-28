import { LightState } from "../../devices/light";
import { OutputDeviceType } from "../../devices/output-device-type";
import { Operator } from "../actions/conditional-action";
import { DataOperation } from "../actions/data-action";

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
    SWITCH = 'switch',
    ID = 'id'
}

export interface DataActionSchema {
    type: ActionType.DATA;
    dataId: string;
    operation: DataOperation;
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
    condition: {
        conditionType: 'data',
        dataId: string,
        operator: Operator,
        operand: number
    };
    trueTriggerId: string;
    falseTriggerId: string;
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

export type ActionSchemaType = DataActionSchema | DeviceActionSchema | StateActionSchema | ConditionalActionSchema;

export interface ActionTriggerSchema {
    actions: ActionSchemaType[]
}