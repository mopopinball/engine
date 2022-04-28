import { RuleEngine } from "./rule-engine";
import { SwitchTriggerSchema, TriggerSchemasType, TriggerTypeEnum } from "./schema/triggers.schema";
import { TriggerFactory } from "./trigger-factory";

describe('Trigger Factory', () => {
    let engine: RuleEngine;

    beforeEach(() => {
        engine = new RuleEngine('test', false, null);
    });

    it('copies a switch trigger correctly', () => {
        // setup
        TriggerFactory.createTrigger({
            type: TriggerTypeEnum.SWITCH,
            switchId: 'a',
            actions: []
        } as TriggerSchemasType, engine);

        // exercise: Both copying a sw trigger and inserting it a index 0.
        TriggerFactory.copyTrigger(engine.triggers[0].toJSON(), null, engine, 0);

        // check
        expect(engine.triggers.length).toBe(2);
        expect((engine.triggers[0] as SwitchTriggerSchema).switchId).toBeNull();
    });
});