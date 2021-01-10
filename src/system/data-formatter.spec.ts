import { RuleData } from "./rule-engine/rule-data";
import { DataFormatter } from "./data-formatter";

describe('display formatter', () => {
    let data: Map<string, RuleData>;
    beforeEach(() => {
        data = new Map<string, RuleData>();
    });

    it('formats plain text', () => {
        // exercise
        const output = DataFormatter.format('text', data);

        // check
        expect(output).toBe('text');
    });

    it('formats text with data', () => {
        // setup
        data.set('d0', {
            id: 'd0',
            value: 13,
            initValue: 13
        });

        data.set('d1', {
            id: 'd1',
            value: 100,
            initValue: 100
        });

        // exercise
        const output = DataFormatter.format('text ${d0} ${d1}', data);

        // check
        expect(output).toBe('text 13 100');
    });
});