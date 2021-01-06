import { RuleData } from "../rule-engine/rule-data";

export abstract class DisplayFormatter {
    private static readonly re = /\${(\w+)}/g;

    // the desired output will be in the format 'string${data}'. Populate that now.
    public static format(formatString: string, data: Map<string, RuleData>): string {
        let output = formatString;
        let match;
        do {
            match = DisplayFormatter.re.exec(formatString);
            if (match) {
                output = output.replace(match[0], data.get(match[1]).value.toString());
            }
        } while (match);
        
        return output;
    }
}