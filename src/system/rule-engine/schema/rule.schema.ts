import { LampState } from "../../playfieldLamp2";
import { DataOperation } from "./rule-data-handler";

export interface RuleSchema {
    id: string;
    autostart: boolean;
    // switches: string[];
    data: DataSchema[];
    devices: [LampSchema | SolenoidSchema],
    actions: [DataActionSchema | DeviceActionSchema | StateActionSchema]
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
}

export interface SolenoidSchema {
    id: string;
    type: 'coil';
}

export interface DataActionSchema {
    type: 'data';
    switchId: string;
    dataId: string;
    operation: number;
    operand: number;
}

export interface DeviceActionSchema {
    type: 'device';
    switchId: string;
    deviceId: string;
    state: number;
}

export interface StateActionSchema {
    type: 'state';
    switchId: string;
    childId: string;
}

export interface SwitchHandlerSchema {
    key: string;
    operation: DataOperation;
    operand: number;
}