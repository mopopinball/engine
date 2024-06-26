import { LightState } from "../devices/light";
import { RuleEngine } from "./rule-engine";
import { RuleSchema } from "./schema/rule.schema";
import * as testData from "../../../test-data/parent-child.json";

describe('Rule Engine Load()', () => {
    const data: RuleSchema = testData as unknown as RuleSchema;

    let ruleEngine: RuleEngine = null;

    beforeEach(() => {
        ruleEngine = RuleEngine.load(data);
    });

    // ,
    // "switches": [["sw0", {"key": "d0", "operation": 0, "operand": 5}]],
    // "devices": [[13, "lamp", "outhole"]]

    it('loads constructor values', () => {
        // check
        expect(ruleEngine.id).toEqual('root');
        expect(ruleEngine.autoStart).toBeTruthy();
    });

    it('loads data', () => {
        // check
        expect(ruleEngine.data.size).toEqual(1);
        expect(ruleEngine.data.get('d0').value).toEqual(13);
    });

    it('loads devices', () => {
        // check
        expect(ruleEngine.devices.size).toBe(3);
        expect(ruleEngine.devices.get('SHOOT_AGAIN').getState()).toEqual(LightState.OFF);
        expect(ruleEngine.devices.get('L4').getState()).toEqual(LightState.ON);
        expect(ruleEngine.devices.get('p1').getState()).toEqual("Mopo");
    });

    it('loads children', () => {
        expect(ruleEngine.children.length).toEqual(1);
        expect(ruleEngine.children[0].devices.size).toEqual(1);
        expect(ruleEngine.children[0].devices.get('L4').getState()).toEqual({blink: 222});
    });

    it('loads actions', () => {
        expect(ruleEngine.triggers.length).toBe(2);
        expect(ruleEngine.getSwitchTrigger('sw0').actions.length).toBe(2);
    });
});