import { LAMP_ROLES } from "../../../devices/playfield-lamp";

export interface RuleSchema {
    id: string;
    metadata?: RuleMetadata;
    autostart: boolean;
    // switches: string[];
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

export interface DataActionSchema extends ActionSchema {
    type: 'data';
    dataId: string;
    operation: number;
    operand: number;
}

export interface DeviceActionSchema extends ActionSchema {
    type: 'device';
    deviceId: string;
    state: number;
}

export interface StateActionSchema extends ActionSchema {
    type: 'state';
    childId?: string;
    state: boolean;
}

export interface ConditionalActionSchema extends ActionSchema {
    type: 'condition';
    statement: string[];
    trueResult: string;
    falseResult: string;
}