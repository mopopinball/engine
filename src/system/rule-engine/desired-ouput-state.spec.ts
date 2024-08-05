import { LightState } from "../devices/light";
import { OutputDeviceType } from "../devices/output-device-type";
import { BlinkLightStyle } from "../devices/styles/blink-light-style";
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

    it('clears the blink rate', () => {
        // setup
        const lightSchema: LightOutputState = {
            id: 'light-id',
            state: LightState.ON,
            type: OutputDeviceType.LIGHT
        };
        const desiredOutput: DesiredOutputState = DesiredOutputState.constructFromOutputState(lightSchema);
        desiredOutput.blinkRate = 555;
        expect(desiredOutput.lightMode).toEqual('BLINK');

        // exercise
        desiredOutput.blinkRate = null;
        desiredOutput.lightState = LightState.OFF;

        // check
        expect(desiredOutput.forLight).toBeTruthy();
        expect(desiredOutput.lightMode).toEqual(LightState.OFF);
        expect(desiredOutput.blinkRate).toBeFalsy();
        expect(desiredOutput.styles.length).toBe(0);
    });

    it('serializes correctly', () => {
        // setup
        const lightSchema: LightOutputState = {
            id: 'light-id',
            state: LightState.ON,
            type: OutputDeviceType.LIGHT,
        };
        const desiredOutput: DesiredOutputState = DesiredOutputState.constructFromOutputState(lightSchema);

        // exercise
        const output = JSON.stringify(desiredOutput);

        // check
        expect(output).toEqual('{"id":"light-id","type":"light","state":1}');
    });

    it('lights toJSON() works correctly', () => {
        // setup
        const light = new DesiredOutputState('id', OutputDeviceType.LIGHT, LightState.ON, [new BlinkLightStyle(500, LightState.OFF)]);

        // exercise
        const json = light.toJSON() as LightOutputState;

        // check
        expect(json.id).toEqual('id');
        expect(json.type).toEqual(OutputDeviceType.LIGHT);
        expect(json.style.blink).toEqual(500);
    });

    it('lights loads from json correctly', () => {
        // setup
        const light = new DesiredOutputState('id', OutputDeviceType.LIGHT, LightState.ON, [new BlinkLightStyle(500, LightState.OFF)]);
        const json = light.toJSON() as LightOutputState;

        // exercise
        const loaded = DesiredOutputState.constructFromOutputState(json);

        // check
        expect(loaded.id).toEqual('id');
        expect(loaded.type).toEqual(OutputDeviceType.LIGHT);
        expect(loaded.styles[0]).toBeInstanceOf(BlinkLightStyle);
        expect((loaded.styles[0] as BlinkLightStyle).interval).toEqual(500);
    });
});