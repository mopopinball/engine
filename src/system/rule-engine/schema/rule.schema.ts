import { LampState } from "../../playfieldLamp2";
import { Action } from "../actions/action";
import { DataOperation } from "./rule-data-handler";

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
    role: string;
    name: string;
    state?: number;
}

export interface SolenoidSchema {
    id: string;
    type: 'coil';
}

export interface ActionSchema {
    switchId: string;
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
    childId: string;
    state: boolean;
}

export interface SwitchHandlerSchema {
    key: string;
    operation: DataOperation;
    operand: number;
}