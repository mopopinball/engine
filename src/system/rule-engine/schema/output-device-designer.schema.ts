import { OutputDeviceType } from "../../devices/output-device-type";
import { DesignerSchema } from "./designer.schema";

export interface OutputDeviceDesignerSchema extends DesignerSchema {
    type: OutputDeviceType
}
