import { RuleSchema } from "./schema/rule.schema";
import { RuleEngine } from "./rule-engine";
import * as testData from "../../../test-data/parent-child.json";
import * as actionSiblingData from "../../../test-data/action-sibling.json";
import { LightState } from "../devices/light";

describe('Rules', () => {
    let ruleEngine: RuleEngine = null;

    function loadTestData(data): RuleSchema {
        return data as unknown as RuleSchema;
    }

    describe('common', () => {
        const data: RuleSchema = loadTestData(testData);

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
            expect(devices.get('SHOOT_AGAIN').getState()).toEqual(LightState.OFF);
            expect(devices.get('L4').getState()).toEqual(LightState.BLINK);
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
            expect(ruleEngine.devices.get('L4').getState()).toEqual(LightState.BLINK);
        });

        it('modifies state', () => {
            // exercise
            ruleEngine.onSwitch('sw1');

            // check
            expect(ruleEngine.getDevices().get("L4").getState()).toEqual(LightState.BLINK);
        });
    });

    describe('state', () => {
        it('loads all engines', () => {
            // setup
            ruleEngine = RuleEngine.load(loadTestData(actionSiblingData));
            
            // exercise
            const engines = ruleEngine.getAllEngines();

            // check
            expect(engines.size).toBe(3);
        });

        it('an action can target a sibling', ()=> {
            // setup
            ruleEngine = RuleEngine.load(loadTestData(actionSiblingData));
            ruleEngine.start();
            expect(ruleEngine.children[0].active).toBeTruthy();

            // exercise
            ruleEngine.onSwitch("sw0");
            expect(ruleEngine.children[0].active).toBeFalsy();
            expect(ruleEngine.children[1].active).toBeTruthy();
        });
    });
});