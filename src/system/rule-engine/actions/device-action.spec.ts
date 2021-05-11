import { LightState } from "../../devices/light";
import { OutputDeviceType } from "../../devices/output-device-type";
import { DesiredOutputState } from "../desired-output-state";
import { ActionType } from "../schema/actions.schema";
import { DeviceAction } from "./device-action";

describe('device action', () => {
    it('toJSON - lamp', () => {
        // setup
        const lampAction: DeviceAction = new DeviceAction(
            new DesiredOutputState(
                'L0', OutputDeviceType.LIGHT, LightState.ON
            )
        );

        // exercise
        const output = lampAction.toJSON();

        // check
        expect(output.type).toBe(ActionType.DEVICE);
        expect(output.state.type).toBe(OutputDeviceType.LIGHT);
        expect(output.state.id).toBe('L0');
    });

    it('toJSON - coil', () => {
        // setup
        const coilAction: DeviceAction = new DeviceAction(
            new DesiredOutputState(
                'C0', OutputDeviceType.COIL, 1
            )
        );

        // exercise
        const output = coilAction.toJSON();

        // check
        expect(output.type).toBe(ActionType.DEVICE);
        expect(output.state.type).toBe(OutputDeviceType.COIL);
        expect(output.state.id).toBe('C0');
    });
});