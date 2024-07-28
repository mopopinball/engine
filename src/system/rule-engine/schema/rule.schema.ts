import { LightState } from "../../devices/light";
import { OutputDeviceType } from "../../devices/output-device-type";
import { DesignerSchema } from "./designer.schema";
import { OutputDeviceDesignerSchema } from "./output-device-designer.schema";
import { TriggerSchemasType } from "./triggers.schema";

export interface RuleSchema {
    id: string;
    metadata?: RuleMetadata;
    autostart: boolean;
    data: DataSchemaType[];
    devices: [LightOutputState | CoilOutputState | SoundOutputState],
    triggers: [TriggerSchemasType],
    children: RuleSchema[],
    designer: {
        outputDevices: OutputDeviceDesignerSchema[]
    } 
}

export interface RuleMetadata {
    name: string;
    description: string;
}

export type DataSchemaType = NumberDataSchema | StringDataSchema;

export interface NumberDataSchema extends DataSchema<number> {
    type: 'number';
    attributes?: {
        isWholeNumber?: boolean,
        resetOnStateStop?: boolean
    }
}

export interface StringDataSchema extends DataSchema<string> {
    type: 'string';
}

export interface DataSchema<T> {
    id: string;
    value: T;
    attributes?: {
        resetOnStateStop?: boolean
    }
}

export interface OutputDeviceState {
    id: string;
}

export interface LightOutputState extends OutputDeviceState {
    type: OutputDeviceType.LIGHT;
    state: LightState;
    style?: OutputStyle
}

export interface CoilOutputState extends OutputDeviceState {
    type: OutputDeviceType.COIL;
    state: boolean;
}

export interface SoundOutputState extends OutputDeviceState {
    type: OutputDeviceType.SOUND;
    play: boolean;
}

export interface DisplayOutputState extends OutputDeviceState {
    type: OutputDeviceType.DISPLAY;
    state: string;
    style?: OutputStyle
}

/**
 * A device output style. For example blinking.
 * 
 * @example
 * {blink: 250}
 */
export interface OutputStyle {
    // [key: string]: string | number | OutputStyle;
    blink?: number;
}

export type OutputStateType = LightOutputState | CoilOutputState | SoundOutputState | DisplayOutputState;
