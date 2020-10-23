import { LampState } from "../../playfieldLamp2";
import { DataOperation } from "./rule-data-handler";

export interface RuleSchema {
    autostart: boolean;
    // switches: string[];
    data: DataShema[];
    devices: [LampSchema | SolenoidSchema],
    actions: [DataActionSchema | DeviceActionSchema]
}

export interface DataShema {
    id: string;
    value: number;
}

export interface LampSchema {
    number: number;
    role: string;
    name: string;
}

export interface SolenoidSchema {

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

export interface SwitchHandlerSchema {
    key: string;
    operation: DataOperation;
    operand: number;
}