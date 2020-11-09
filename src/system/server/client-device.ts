import { DriverType } from "../devices/driver-type";

export interface ClientDevice {
    id: string;
    name: string;
    isOn: boolean;
    number: number;
    driverType?: DriverType
}