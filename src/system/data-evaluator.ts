import { DataFormatter } from "./data-formatter";
import { NumberData } from "./rule-engine/rule-data";
import {Parser} from 'expr-eval';

export abstract class DataEvaluator {
    private static parser = new Parser();

    public static evaluate(expressionString: string, data: Map<string, NumberData>): number {
        const formattedString = DataFormatter.format(expressionString, data);
        return DataEvaluator.evaluateFormattedString(formattedString);
    }

    public static evaluatePlain(expression: string, data: Map<string, NumberData>): number {
        const parsedExpression = this.parser.parse(expression);
        const variables = parsedExpression.variables();
        const values = {};
        for (const v of variables) {
            values[v] = data.get(v).value;
        }
        return parsedExpression.evaluate(values);
    }

    public static evaluateBoolean(formattedString: string): boolean {
        const sanatizedFormattedString = formattedString.replace('===', '==');
        return this.evaluateFormattedString(sanatizedFormattedString);
    }

    private static evaluateFormattedString(formattedString: string) {
        const expression = this.parser.parse(formattedString);
        return expression.evaluate();
    }
}