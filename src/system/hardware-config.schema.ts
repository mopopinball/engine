import { CoilType } from "./devices/coil";
import { LAMP_ROLES } from "./devices/playfield-lamp";
import { SystemName } from "./game";

export interface HardwareConfig {
    name: string;
    system: SystemName;
    devices: DeviceConfigSchema;
    sounds: SoundsSchema;
}

export interface DeviceConfigSchema {
    switches: SwitchesSchema;
    lamps: LampsSchema | CoilsSchema;
    coils: CoilsSchema;
}

export interface SwitchesSchema {
    [key: string]: HardwareSwitchSchema;
}

export interface HardwareSwitchSchema {
    number: number;
    name: string;
    qualifiesPlayfield?: boolean;
    debounceIntervalMs?: number;
}

export interface LampsSchema {
    [key: string]: HardwareLampSchema;
}

export interface HardwareLampSchema {
    number: number;
    role: LAMP_ROLES;
    name: string;
    coilType: string;
}

export interface CoilsSchema {
    [key: string]: HardwareCoilSchema;
}

export interface HardwareCoilSchema {
    number: number;
    name: string;
    coilType: CoilType;
    durationMs: number;
    role?: LAMP_ROLES;
}

export interface SoundsSchema {
    [key: string]: HardwareSoundSchema;
}

export interface HardwareSoundSchema {
    number: number;
    description: string;
}