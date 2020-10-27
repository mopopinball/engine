import { LampState } from "../../playfieldLamp2";
import { Action } from "../actions/action";

export interface RuleSchema {
    id: string;
    autostart: boolean;
    // switches: string[];
    data: DataSchema[];
    devices: [LampSchema | SolenoidSchema],
    actions: [DataActionSchema | DeviceActionSchema | StateActionSchema],
    children: RuleSchema[]
}

export interface DataSchema {
    id: string;
    value: number;
}

export interface LampSchema {
    id: string;
    type: 'lamp';
    number: number;
    role: number;
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