import { LightState } from "../devices/light";
import { OutputDeviceType } from "../devices/output-device-type";
import { DesiredOutputState } from "./desired-output-state";
import { LightOutputState } from "./schema/rule.schema";

describe('Desired output state', () => {
    it('loads from light schema', () => {
        // setup
        const lightSchema: LightOutputState = {
            id: 'light-id',
            state: LightState.ON,
            type: OutputDeviceType.LIGHT
        };

        // exercise
        const desiredOutput: DesiredOutputState = DesiredOutputState.constructFromOutputState(lightSchema);

        // check
        expect(desiredOutput.forLight).toBeTruthy();
        expect(desiredOutput.lightMode).toEqual(LightState.ON);
        expect(desiredOutput.id).toBe(lightSchema.id);
        expect(desiredOutput.type).toBe(lightSchema.type);
        expect(desiredOutput.lightState).toBe(lightSchema.state);

        expect(desiredOutput.blinkRate).toBeUndefined();
    });

    it('sets the blink rate', () => {
        // setup
        const lightSchema: LightOutputState = {
            id: 'light-id',
            state: LightState.ON,
            type: OutputDeviceType.LIGHT
        };
        const desiredOutput: DesiredOutputState = DesiredOutputState.constructFromOutputState(lightSchema);

        // exercise
        desiredOutput.blinkRate = 555;

        // check
        expect(desiredOutput.forLight).toBeTruthy();
        expect(desiredOutput.lightMode).toEqual('BLINK');
        expect(desiredOutput.lightState).toBe(lightSchema.state);

        expect(desiredOutput.blinkRate).toEqual(555);
    });

    it('serializes correctly', () => {
        // setup
        const lightSchema: LightOutputState = {
            id: 'light-id',
            state: LightState.ON,
            type: OutputDeviceType.LIGHT
        };
        const desiredOutput: DesiredOutputState = DesiredOutputState.constructFromOutputState(lightSchema);

        // exercise
        const output = JSON.stringify(desiredOutput);

        // check
        expect(output).toEqual('{"id":"light-id","type":"light","state":1}');
    });
});