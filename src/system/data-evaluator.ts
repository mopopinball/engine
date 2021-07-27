import { DataFormatter } from "./data-formatter";
import { NumberData } from "./rule-engine/rule-data";
import {Expression, Parser} from 'expr-eval';
import {logger} from './logger';

export abstract class DataEvaluator {
    private static parser = new Parser();

    public static evaluate(expressionString: string, data: Map<string, NumberData>): number {
        const formattedString = DataFormatter.format(expressionString, data);
        const parsedExpression = this.parser.parse(formattedString);
        return this.evaluateWorker(parsedExpression, data);
    }

    public static evaluatePlain(expression: string, data: Map<string, NumberData>): number {
        const parsedExpression = this.parser.parse(expression);
        return this.evaluateWorker(parsedExpression, data);
    }

    public static evaluateBoolean(expression: string, data: Map<string, NumberData>): boolean {
        const sanatizedExpression = expression.replace('===', '==');
        const parsedExpression = this.parser.parse(sanatizedExpression);
        return this.evaluateWorker(parsedExpression, data);
    }

    private static mapData(parsedExpression: Expression, data: Map<string, NumberData>): any {
        const variables = parsedExpression.variables();
        const values = {};
        for (const v of variables) {
            values[v] = data.get(v).value;
        }
        return values;
    }

    private static evaluateWorker(expression: Expression, data: Map<string, NumberData>): any {
        const values = this.mapData(expression, data);
        const result = expression.evaluate(values);
        const stringValues = Object.entries(values).map((entry) => `${entry[0]}=${entry[1]}`).join(', ');
        logger.debug(`[Data Evaluator] Evaluating "${expression}" with symbols ${stringValues} to result "${result}"`); 
        return result;
    }
}