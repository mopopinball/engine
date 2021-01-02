import { RuleSchema } from "./schema/rule.schema";
import { RuleEngine } from "./rule-engine";
import * as testData from "../../../test-data/parent-child.json";
import * as actionSiblingData from "../../../test-data/action-sibling.json";
import { LightState } from "../devices/light";
import { SwitchActionTrigger } from "./actions/switch-action-trigger";
import { DataAction, DataOperation } from "./actions/data-action";

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

        it('getSwitchTrigger - null vs undefined hold time', () => {
            // setup
            ruleEngine.triggers = [];
            ruleEngine.triggers.push(new SwitchActionTrigger(
                'sw0',
                null
            ));

            // exercise
            const trigger = ruleEngine.getSwitchTrigger('sw0');

            // check
            expect(trigger).toBeTruthy();
        });

        it('getSwitchTrigger - hold time', () => {
            // setup
            ruleEngine.triggers = [];
            ruleEngine.triggers.push(new SwitchActionTrigger(
                'sw0',
                666
            ));

            // exercise
            const trigger = ruleEngine.getSwitchTrigger('sw0', 666);
            const triggerWithoutHoldTime = ruleEngine.getSwitchTrigger('sw0');

            // check
            expect(trigger).toBeTruthy();
            expect(triggerWithoutHoldTime).toBeFalsy();
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
            ruleEngine.onSwitch('sw0');
            expect(ruleEngine.children[0].active).toBeFalsy();
            expect(ruleEngine.children[1].active).toBeTruthy();
        });
    });

    describe('data', () => {
        beforeEach(() => {
            const data: RuleSchema = loadTestData(testData);
            ruleEngine = RuleEngine.load(data);
            ruleEngine.data.clear();
            addData(ruleEngine, 'd0', 13);
        });

        it('gets data', () => {
            // exercise
            const d0 = ruleEngine.getData().get('d0');

            // check
            expect(d0.value).toBe(13)
        });

        it('gets data with child overwriting - inactive', () => {
            // setup
            ruleEngine.children[0].data.clear();
            addData(ruleEngine.children[0], 'd0', 1);
            addData(ruleEngine.children[0], 'd1', 2);           

            // exercise
            const d0 = ruleEngine.getData().get('d0');
            const d1 = ruleEngine.getData().get('d1');

            // check
            expect(ruleEngine.data.size).toBe(1);
            expect(d0.value).toBe(13);
            expect(d1).toBeFalsy();
        });

        it('gets data with child overwriting', () => {
            // setup
            ruleEngine.start();
            ruleEngine.children[0].start();
            ruleEngine.children[0].data.clear();
            addData(ruleEngine.children[0], 'd0', 1);
            addData(ruleEngine.children[0], 'd1', 2);           

            // exercise
            const d0 = ruleEngine.getData().get('d0');
            const d1 = ruleEngine.getData().get('d1');

            // check
            expect(ruleEngine.data.size).toBe(1);
            expect(d0.value).toBe(1);
            expect(d1.value).toBe(2);
        });

        it('switch can trigger data operation', () => {
            // setup
            ruleEngine.triggers = [];
            ruleEngine.triggers.push(new SwitchActionTrigger(
                'sw0'
            ));
            ruleEngine.triggers[0].actions.push(
                new DataAction('d0', DataOperation.INCREMENT, 10)
            );

            // exercise
            ruleEngine.onSwitch('sw0');

            // check
            expect(ruleEngine.getData().get('d0').value).toBe(23);
        });

        it('getInheritedData', () => {
            // setup
            ruleEngine.data.clear();
            addData(ruleEngine, 'd0', 0);
            addData(ruleEngine, 'd1', 1);
            const child = ruleEngine.children[0];
            addData(child, 'd1', 11);

            // exercise
            const data = child.getInheritedData();

            // check
            expect(data.size).toBe(2);
            expect(data.get('d0').value).toBe(0);
            expect(data.get('d1').value).toBe(11);
        });

        it('resets data on stop which requires reset', () => {
            // setup
            ruleEngine.data.clear();
            addData(ruleEngine, 'd0', 0);
            addData(ruleEngine, 'd1', 1, true);
            ruleEngine.start();
            ruleEngine.data.get('d0').value = 1000;
            ruleEngine.data.get('d1').value = 1000;
            
            // exercise
            ruleEngine.stop();

            // check
            expect(ruleEngine.data.get('d0').value).toBe(1000);
            expect(ruleEngine.data.get('d1').value).toBe(1);
        });

        function addData(ruleEngine: RuleEngine, id: string, value: number, reset = false): void {
            ruleEngine.data.set(id, {
                id: id,
                value: value,
                initValue: value,
                attributes: {
                    resetOnStateStop: reset
                }
            });         
        }
    });

    describe('serialization', () => {
        it('serializes correctly', () => {
            //setup
            const data: RuleSchema = loadTestData(testData);
            ruleEngine = RuleEngine.load(data);

            // exercise
            const serialization = JSON.stringify(ruleEngine);

            // check
            expect(serialization).toBeTruthy();
            // expect(serialization).toBe('{"devices":[{"id":"SHOOT_AGAIN","type":"light","state":0},{"id":"L4","type":"light","state":1}]}');
        });
    });
});