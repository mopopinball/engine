import { ConditionClause, SwitchCondition } from "./condition-clause";

describe('conditional-clause', () => {
    it('serialized-deserializes', () => {
        // setup
        const clause = new ConditionClause([
            {
                conditionType: 'switch',
                switchId: 'sw',
                activated: true
            }], {
            triggerId: 't0'
        }
        )
        
        // exercise
        const serialized = clause.toJSON();
        const deserial = ConditionClause.fromJSON(serialized);

        // check
        expect(deserial.conditions.length).toBe(1);
        expect(deserial.conditions[0].conditionType).toBe('switch');
        const condition = deserial.conditions[0] as SwitchCondition;
        expect(condition.switchId).toBe('sw');
        expect(condition.activated).toBe(true);

        expect(clause.trueResult.triggerId).toBe('t0');
    });
});