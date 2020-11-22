import { LightState } from "../../devices/light";
import { OutputDeviceType } from "../../devices/output-device-type";

export interface RuleSchema {
    id: string;
    metadata?: RuleMetadata;
    autostart: boolean;
    data: DataSchema[];
    devices: [LightOutputState | CoilOutputState | SoundOutputState],
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

// export interface LampSchema {
//     id: string;
//     type: OUTPUT_DEVICE_TYPES.LIGHT;
//     number: number;
//     role: LAMP_ROLES;
//     name: string;
//     state?: number;
// }

// export interface SolenoidSchema {
//     id: string;
//     type: OUTPUT_DEVICE_TYPES.COIL;
//     number: number;
//     name: string;
//     coilType: CoilType;
//     durationMs: number;
// }

// export interface SoundSchema {
//     id: string;
//     type: OUTPUT_DEVICE_TYPES.SOUND;
//     number: number;
//     play: boolean;
//     // description: string;
//     // background: boolean;
// }

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