import { RuleData } from "../rule-engine/rule-data";

export abstract class DisplayFormatter {

    // the desired output will be in the format 'string${data}'. Populate that now.
    public static format(formatString: string, data: Map<string, RuleData>): string {
        return '';
    }
}