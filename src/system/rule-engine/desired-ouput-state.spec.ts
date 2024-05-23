import { LightState } from "../devices/light";
import { OutputDeviceType } from "../devices/output-device-type";
import { DesiredOutputState } from "./desired-output-state";
import { LightOutputState } from "./schema/rule.schema";

describe('Desired output state', () => {
    it('loads from light schema', () => {
        // setup
        const lightSchema: LightOutputState = {
            id: 'light-id',
            state: {blink: 245},
            type: OutputDeviceType.LIGHT
        };

        // exercise
        const desiredOutput: DesiredOutputState = DesiredOutputState.constructFromOutputState(lightSchema);

        // check
        expect(desiredOutput.id).toBe(lightSchema.id);
        expect(desiredOutput.type).toBe(lightSchema.type);
        expect(desiredOutput.getState()).toBe(lightSchema.state);
    });

    it('serializes correctly', () => {
        // setup
        const lightSchema: LightOutputState = {
            id: 'light-id',
            state: { blink: 222 },
            type: OutputDeviceType.LIGHT
        };
        const desiredOutput: DesiredOutputState = DesiredOutputState.constructFromOutputState(lightSchema);

        // exercise
        const output = JSON.stringify(desiredOutput);

        // check
        expect(output).toEqual('{"id":"light-id","type":"light","state":{"blink":222}}');
    });
});