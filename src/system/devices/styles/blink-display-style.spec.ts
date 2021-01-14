import { GameClock } from "../../game-clock";
import { BlinkDisplayStyle } from "./blink-display-style";

describe('blink display', () => {
    it('blinks the display at the given rate', () => {
        // setup
        GameClock.getInstance().loopStart = 1000;
        const blinkStyle = new BlinkDisplayStyle(250, 'Mopo');

        // exercise & test
        let output = blinkStyle.update();
        expect(output).toBe('Mopo');

        GameClock.getInstance().loopStart = 1100;
        output = blinkStyle.update();
        expect(output).toBe('Mopo');

        GameClock.getInstance().loopStart = 1200;
        output = blinkStyle.update();
        expect(output).toBe('Mopo');

        GameClock.getInstance().loopStart = 1300;
        output = blinkStyle.update();
        expect(output).toBe('');

        GameClock.getInstance().loopStart = 1400;
        output = blinkStyle.update();
        expect(output).toBe('');
    });
});