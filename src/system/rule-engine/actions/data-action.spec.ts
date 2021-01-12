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

    it('can increment', () => {
        // setup
        const action = new DataAction('d0', DataOperation.INCREMENT, '1');

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

    it('can increment another data item', () => {
        // setup
        dataMap.set('d1', {
            id: 'd1',
            value: 55,
            initValue: 55
        });
        const action = new DataAction('d0', DataOperation.INCREMENT, '${d1}');

        // exercise
        action.handle(null, dataMap, null);

        // check
        expect(d0.value).toBe(65);
    });

    it('can evaluate and expression with data', () => {
        // setup
        dataMap.set('d1', {
            id: 'd1',
            value: 55,
            initValue: 55
        });
        const action = new DataAction('d0', DataOperation.ASSIGN, '${d1} * 10');

        // exercise
        action.handle(null, dataMap, null);

        // check
        expect(d0.value).toBe(550);
    });

    it('can evaluate and expression with mod data', () => {
        // setup
        const action = new DataAction('d0', DataOperation.ASSIGN, '${d0} % 3');

        // exercise
        action.handle(null, dataMap, null);

        // check
        expect(d0.value).toBe(1);
    });
});