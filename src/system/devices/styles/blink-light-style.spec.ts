import { GameClock } from "../../game-clock";
import { OutputStyle } from "../../rule-engine/schema/rule.schema";
import { LightState } from "../light";
import { BlinkLightStyle } from "./blink-light-style";

describe('blink light style', () => {
    it('loads a blink style', () => {
        // setup
        const styleStr: OutputStyle = {blink: 250};

        // exercise
        const style = BlinkLightStyle.build(styleStr);

        // check
        expect(style).toBeTruthy();
        expect(style.interval).toBe(250);
    });

    it('loads a blink style from string', () => {
        // setup
        const styleStr: OutputStyle = JSON.parse('{"blink": 250}');

        // exercise
        const style = BlinkLightStyle.build(styleStr);

        // check
        expect(style).toBeTruthy();
        expect(style.interval).toBe(250);
    });

    it('at 100ms it takes three ticks to update', () => {
        // setup
        GameClock.getInstance().loopStart = 1000;
        const blinkStyle = new BlinkLightStyle(275, LightState.OFF);

        // exercise & check
        let output = blinkStyle.update();
        expect(output).toBe(LightState.OFF);
        
        GameClock.getInstance().loopStart = 1100;
        output = blinkStyle.update();
        expect(output).toBe(LightState.OFF);

        GameClock.getInstance().loopStart = 1200;
        output = blinkStyle.update();
        expect(output).toBe(LightState.OFF);

        GameClock.getInstance().loopStart = 1300;
        output = blinkStyle.update();
        expect(output).toBe(LightState.ON);

        GameClock.getInstance().loopStart = 1400;
        output = blinkStyle.update();
        expect(output).toBe(LightState.ON);
    });
});