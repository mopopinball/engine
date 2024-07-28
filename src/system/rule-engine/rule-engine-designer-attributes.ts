import { OutputDeviceType } from "../devices/output-device-type";
import { DesignerAttributes } from "./designer-attributes";

export type RuleEngineDesignerAttributes = DesignerAttributes | {
    type: OutputDeviceType,
};