import { DataEvaluator } from "./data-evaluator";
import { NumberData } from "./rule-engine/rule-data";

describe('Data Evaluator', () => {

    const sampleData = new Map<string, NumberData>();

    beforeEach(() => {
        sampleData.clear();
        sampleData.set('ballNumber', {value: 1} as NumberData);
        sampleData.set('moreData', {value: -1} as NumberData)
    });

    it('evaluates boolean', () => {
        const expression = '10 > 2';

        const output = DataEvaluator.evaluateBoolean(expression, sampleData);

        expect(output).toBeTruthy();
    });

    it('evaluates equality', () => {
        const expression = '10 == 10';

        const output = DataEvaluator.evaluateBoolean(expression, sampleData);

        expect(output).toBeTruthy();
    });

    it('evaluates stronger equality', () => {
        const expression = '10 === 10';

        const output = DataEvaluator.evaluateBoolean(expression, sampleData);

        expect(output).toBeTruthy();
    });

    it('evaluates boolean expression with variable', () => {
        const expression = 'ballNumber > 3';

        const output = DataEvaluator.evaluateBoolean(expression, sampleData);

        expect(output).toBeFalsy();
    });
});
