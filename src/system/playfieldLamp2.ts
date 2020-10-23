export class PlayfieldLamp2 {
    private state: LampState;
    
    constructor(private number: number, private role: string, private name: string) {
        this.state = LampState.OFF;
    }

    setState(state: LampState): void {
        this.state = state;
    }

    getState(): LampState {
        return this.state;
    }
}

export enum LampState {
    ON,
    OFF,
    BLINK
}