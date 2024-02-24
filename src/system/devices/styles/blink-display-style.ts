import { GameClock } from "../../game-clock";
import { OutputStyle } from "../../rule-engine/schema/rule.schema";
import { Style } from "./style";

export class BlinkDisplayStyle implements Style {
    private on = true;
    private currentState: string;
    private remaining = 0;
    private lastStart: number = null;
    private static readonly OFF_STATE = '';
    
    // accepts a style in the format "blink: 250"
    static build(initState: string, style?: OutputStyle): BlinkDisplayStyle {
        if (!style) {
            return null;
        }
        const blinkStyleEntry = Object.entries(style).find((entry) => entry[0] === 'blink');
        if (blinkStyleEntry) {
            return new BlinkDisplayStyle(blinkStyleEntry[1] as number, initState);
        }
        else {
            return null;
        }
    }

    constructor(public readonly interval: number, private initState: string) {
        this.currentState = initState;
        this.remaining = interval;
    }

    updateInitState(newState: string): void {
        this.initState = newState;
    }

    update(): string {
        const startTime = GameClock.getInstance().loopStart;
        const diff = startTime - (this.lastStart ?? startTime);
        this.lastStart = startTime;
        this.remaining -= diff;

        if (this.remaining <= 0) {
            if (this.on) {
                this.currentState = BlinkDisplayStyle.OFF_STATE;
            }
            else {
                this.currentState = this.initState;
            }
            this.remaining = this.interval;
            this.on = !this.on;
        }

        return this.currentState;
    }

}