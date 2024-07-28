import { OutputDeviceType } from "../devices/output-device-type";
import { DesignerAttributes } from "./designer-attributes";

export interface RuleEngineDesignerAttributes extends DesignerAttributes {
    type: OutputDeviceType,
}