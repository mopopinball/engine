import { RuleData } from "../rule-data";
import { DataAction, DataOperation } from "./data-action";

describe('data action', () => {
    let d0: RuleData = null;
    const dataMap = new Map<string, RuleData>();

    beforeEach(() => {
        d0 = {
            id: 'd0',
            value: 10,
            initValue: 10
        };
        dataMap.set('d0', d0);
    });

    it('can increment', () => {
        // setup
        const action = new DataAction('d0', DataOperation.INCREMENT, 1);

        // exercise
        action.handle(null, dataMap, null);

        // check
        expect(d0.value).toBe(11);
    });

    it('can decrement', () => {
        // setup
        const action = new DataAction('d0', DataOperation.DECREMENT, 1);

        // exercise
        action.handle(null, dataMap, null);

        // check
        expect(d0.value).toBe(9);
    });

    it('can assign', () => {
        // setup
        const action = new DataAction('d0', DataOperation.ASSIGN, 1);

        // exercise
        action.handle(null, dataMap, null);

        // check
        expect(d0.value).toBe(1);
    });

    it('can multiply', () => {
        // setup
        const action = new DataAction('d0', DataOperation.MULTIPLY, 2);

        // exercise
        action.handle(null, dataMap, null);

        // check
        expect(d0.value).toBe(20);
    });

    it('can divide', () => {
        // setup
        const action = new DataAction('d0', DataOperation.DIVIDE, 2);

        // exercise
        action.handle(null, dataMap, null);

        // check
        expect(d0.value).toBe(5);
    });

    it('can decrement and obey whole number constraint', () => {
        // setup
        dataMap.get('d0').attributes = {
            isWholeNumber: true
        }
        const action = new DataAction('d0', DataOperation.DECREMENT, 100);

        // exercise
        action.handle(null, dataMap, null);

        // check
        expect(d0.value).toBe(0);
    });
});