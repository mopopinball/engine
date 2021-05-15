import { DataEvaluator } from "./data-evaluator";

describe('Data Evaluator', () => {
    it('evaluates boolean', () => {
        const expression = '10 > 2';

        const output = DataEvaluator.evaluateBoolean(expression);

        expect(output).toBeTruthy();
    });

    it('evaluates equality', () => {
        const expression = '10 == 10';

        const output = DataEvaluator.evaluateBoolean(expression);

        expect(output).toBeTruthy();
    });

    it('evaluates stronger equality', () => {
        const expression = '10 === 10';

        const output = DataEvaluator.evaluateBoolean(expression);

        expect(output).toBeTruthy();
    });

    it('evaluates a string if', () => {
        const expression = 'if(3 > 2, "big", "small")';

        const output = DataEvaluator.evaluatePlain(expression, new Map());

        expect(output).toBe('big');
    });

    it('evaluates a string if without else', () => {
        const expression = 'if(3 > 2, "big")';

        const output = DataEvaluator.evaluatePlain(expression, new Map());

        expect(output).toBe('big');
    });
});
