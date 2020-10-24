import { LampState } from "../playfieldLamp2";
import { RuleSchema } from "./schema/rule.schema";
import { RuleEngine } from "./rule-engine";
import * as testData from "./test-data.json";

describe.skip('Rules', () => {
    const data: RuleSchema = testData as RuleSchema;

    it('constructs and auto starts', () => {
        const rule = new RuleEngine('root', true);
        rule.start();
        
        expect(rule).toBeTruthy();
        expect(rule.active).toBeTruthy();

        const x = new Map<string, string>();
        x.set('a', 'b');
        x.set('c','d');
        const json = JSON.stringify(Array.from(x.entries()));
        console.log(json);
    });

    // it('loads switches from schema', () => {
    //     // exercise
    //     const rule = new RuleEngine('root', false);
    //     rule.load(data);

    //     // check
    //     expect(rule.autoStart).toBeTruthy();
    //     expect(rule.switches.size).toEqual(1);
    // });

    // it('loads lamps from schema', () => {
    //     // exercise
    //     const rule = new RuleEngine('root', false);
    //     rule.load(data);

    //     // check
    //     expect(rule.devices.size).toBe(1);
    //     expect(rule.devices.get('outhole').getState()).toEqual(LampState.OFF);
    // });

    // it('collapes devices', () => {
    //     // setup
    //     const rule = new RuleEngine('root', false);
    //     rule.load(data);

    //     // exercise
    //     const devices = rule.getDevices();

    //     // check
    //     expect(devices.size).toBe(1);
    //     expect(devices.get('outhole').getState()).toEqual(LampState.OFF);
    // });

    // it('modifies data', () => {
    //     // setup
    //     const rule = new RuleEngine('root', false);
    //     rule.load(data);

    //     // exercise
    //     rule.onSwitch('sw0');

    //     // check
    //     expect(rule.data.get('d0').value).toEqual(5);
    // });
})