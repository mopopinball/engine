import { DataFormatter } from "./data-formatter";
import { RuleData } from "./rule-engine/rule-data";
import {Parser} from 'expr-eval';

export abstract class DataEvaluator {
    private static parser = new Parser();

    public static evaluate(expressionString: string, data: Map<string, RuleData>): number {
        const formattedString = DataFormatter.format(expressionString, data);
        return DataEvaluator.evaluateFormattedString(formattedString);
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