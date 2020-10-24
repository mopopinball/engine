export class PlayfieldLamp2 {
    private state: LampState;
    
    constructor(
        private number: number, private role: string, private name: string,
        state: LampState = LampState.OFF
    ) {
        this.state = state;
    }

    setState(state: LampState): void {
        this.state = state;
    }

    getState(): LampState {
        return this.state;
    }
}

export enum LampState {
    OFF = 0,
    ON = 1,
    BLINK = 2
}