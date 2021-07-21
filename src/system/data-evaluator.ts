import { DataFormatter } from "./data-formatter";
import { NumberData } from "./rule-engine/rule-data";
import {Expression, Parser} from 'expr-eval';

export abstract class DataEvaluator {
    private static parser = new Parser();

    public static evaluate(expressionString: string, data: Map<string, NumberData>): number {
        const formattedString = DataFormatter.format(expressionString, data);
        return DataEvaluator.evaluateFormattedString(formattedString);
    }

    public static evaluatePlain(expression: string, data: Map<string, NumberData>): number {
        const parsedExpression = this.parser.parse(expression);
        const values = this.mapData(parsedExpression, data);
        return parsedExpression.evaluate(values);
    }

    private static mapData(parsedExpression: Expression, data: Map<string, NumberData>): any {
        const variables = parsedExpression.variables();
        const values = {};
        for (const v of variables) {
            values[v] = data.get(v).value;
        }
        return values;
    }

    public static evaluateBoolean(expression: string, data: Map<string, NumberData>): boolean {
        const sanatizedExpression = expression.replace('===', '==');
        const parsedExpression = this.parser.parse(sanatizedExpression);
        const values = this.mapData(parsedExpression, data);
        return parsedExpression.evaluate(values);
    }

    private static evaluateFormattedString(formattedString: string) {
        const expression = this.parser.parse(formattedString);
        return expression.evaluate();
    }
}