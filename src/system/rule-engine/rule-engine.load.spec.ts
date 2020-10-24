import { LampState } from "../playfieldLamp2";
import { RuleEngine } from "./rule-engine";
import { RuleSchema } from "./schema/rule.schema";
import * as testData from "./test-data.json";

describe('Rule Engine Load()', () => {
    const data: RuleSchema = testData as RuleSchema;

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
        expect(ruleEngine.devices.size).toBe(1);
        expect(ruleEngine.devices.get('SHOOT_AGAIN').getState()).toEqual(LampState.OFF);
    });
});