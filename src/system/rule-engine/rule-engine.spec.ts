import { LampState } from "../playfieldLamp2";
import { RuleSchema } from "./schema/rule.schema";
import { RuleEngine } from "./rule-engine";
import * as testData from "./test-data.json";

describe('Rules', () => {
    const data: RuleSchema = testData as RuleSchema;

    let ruleEngine: RuleEngine = null;

    beforeEach(() => {
        ruleEngine = RuleEngine.load(data);
    });

    it('constructs and auto starts', () => {
        // exercise
        ruleEngine.start();

        expect(ruleEngine.active).toBeTruthy();
    });

    it('collapes devices', () => {
        // setup
        ruleEngine.start();

        // exercise
        const devices = ruleEngine.getDevices();

        // check
        expect(devices.size).toBe(2);
        expect(devices.get('SHOOT_AGAIN').getState()).toEqual(LampState.OFF);
        expect(devices.get('L1').getState()).toEqual(LampState.ON);
    });

    it('modifies data', () => {
        // exercise
        ruleEngine.onSwitch('sw0');

        // check
        expect(ruleEngine.data.get('d0').value).toEqual(18);
    });

    it('modifies device', () => {
        // exercise
        ruleEngine.onSwitch('sw0');

        // check
        expect(ruleEngine.devices.get('L1').getState()).toEqual(LampState.BLINK);
    });

    it('modifies state', () => {
        // exercise
        ruleEngine.onSwitch('sw1');

        // check
        expect(ruleEngine.getDevices().get("L1").getState()).toEqual(LampState.OFF);
    });
})