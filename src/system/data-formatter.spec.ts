import { NumberData } from "./rule-engine/rule-data";
import { DataFormatter } from "./data-formatter";
import { DesiredOutputState } from "./rule-engine/desired-output-state";
import { OutputDeviceType } from "./devices/output-device-type";
import { BlinkDisplayStyle } from "./devices/styles/blink-display-style";
import { GameClock } from "./game-clock";

describe('display formatter', () => {
    let data: Map<string, NumberData>;
    beforeEach(() => {
        data = new Map<string, NumberData>();
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
            type: 'number',
            id: 'd0',
            value: 13,
            initValue: 13
        });

        data.set('d1', {
            type: 'number',
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