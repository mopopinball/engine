import { LAMP_ROLES } from "../../../devices/playfield-lamp";

export interface RuleSchema {
    id: string;
    metadata?: RuleMetadata;
    autostart: boolean;
    data: DataSchema[];
    devices: [LampSchema | SolenoidSchema],
    actions: [DataActionSchema | DeviceActionSchema | StateActionSchema],
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

export interface LampSchema {
    id: string;
    type: 'lamp';
    number: number;
    role: LAMP_ROLES;
    name: string;
    state?: number;
}

export interface SolenoidSchema {
    id: string;
    type: 'coil';
}

export interface ActionSchema {
    id: string;
    switchId?: string;
    next: string[];
}

export enum ActionType {
    DATA = 'data',
    DEVICE = 'device',
    STATE = 'state',
    CONDITION = 'condition'
}

export interface DataActionSchema extends ActionSchema {
    type: ActionType.DATA;
    dataId: string;
    operation: number;
    operand: number;
}

export interface DeviceActionSchema extends ActionSchema {
    type: ActionType.DEVICE;
    deviceId: string;
    state: number;
}

export interface StateActionSchema extends ActionSchema {
    type: ActionType.STATE;
    startTargetId: string;
    stopTargetId: string;
}

export interface ConditionalActionSchema extends ActionSchema {
    type: ActionType.CONDITION;
    statement: string[];
    trueResult: string;
    falseResult: string;
}