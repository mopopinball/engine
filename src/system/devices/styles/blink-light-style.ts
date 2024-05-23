import { GameClock } from "../../game-clock";
import { OutputStyle } from "../../rule-engine/schema/rule.schema";
import { LightState } from "../light";
import { Style } from "./style";

export class BlinkLightStyle implements Style {
    private currentState: LightState;
    private remaining = 0;
    private lastStart: number = null;
    
    constructor(public interval: number, initState: LightState) {
        this.currentState = initState;
        this.remaining = interval;
    }

    // accepts a style in the format "blink: 250"
    static build(style?: OutputStyle): BlinkLightStyle {
        if(style?.blink) {
            return new BlinkLightStyle(style.blink, LightState.OFF);
        }
        else {
            return null;
        }
    }

    update(): LightState {
        const startTime = GameClock.getInstance().loopStart;
        const diff = startTime - (this.lastStart ?? startTime);
        this.lastStart = startTime;
        this.remaining -= diff;

        if (this.remaining <= 0) {
            if (this.currentState === LightState.ON) {
                this.currentState = LightState.OFF;
            }
            else {
                this.currentState = LightState.ON;
            }
            this.remaining = this.interval;
        }

        return this.currentState;
    }

    // toJSON(): OutputStyle {
    //     return {
    //         blink: this.interval
    //     }
    // }

}