import { LightState } from "../devices/light";
import { OutputDeviceType } from "../devices/output-device-type";
import { CoilOutputState, LightOutputState, OutputDeviceState, SoundOutputState } from "./schema/rule.schema";

export declare type DesiredOutputStateType = LightState | boolean;

export class DesiredOutputState {
    private currentState: DesiredOutputStateType;
    private preTempState: DesiredOutputStateType;
    public temp = false;
    
    static constructFromOutputState(ouputState: LightOutputState | CoilOutputState | SoundOutputState) {
        switch(ouputState.type) {
            case OutputDeviceType.SOUND:
                return new DesiredOutputState(
                    ouputState.id, ouputState.type, ouputState.play
                );
            default:
                return new DesiredOutputState(
                    ouputState.id, ouputState.type, ouputState.state
                );
        }
    }
    
    constructor(public readonly id: string, public readonly type: OutputDeviceType, private initialState: DesiredOutputStateType) {
        this.currentState = initialState;
    }

    setInitialState(state: DesiredOutputStateType) {
        this.initialState = state;
        this.currentState = state;
    }

    getState(): DesiredOutputStateType {
        return this.currentState;
    }

    setState(state: DesiredOutputStateType, setByAction: boolean): void {
        // Non-instanious states set by an action need to be unset when that rule exits.
        // eg. clear a action which turns on a light, or relay, etc.
        // This allows instant states (eg. fire a coil) to be serviced by the game even if a trigger
        // fires the coil and exits the state. Turning a light on and exiting the state would therefore
        // not illuminate the light.
        if (setByAction && !this.isInstantState(state)) {
            this.preTempState = this.currentState;
        }
        this.currentState = state;
        this.temp = setByAction;
    }

    private isInstantState(state: DesiredOutputStateType): boolean {
        // TODO: This should check if the coil is a relay.
        return this.type === OutputDeviceType.SOUND || (this.type === OutputDeviceType.COIL);
    }

    reset(): void {
        this.currentState = this.initialState;
    }

    resetTemp(): void {
        if (!this.temp) {
            return;
        }
        this.currentState = this.preTempState;
    }

    toJSON(): LightOutputState | CoilOutputState | SoundOutputState {
        switch(this.type) {
            case OutputDeviceType.SOUND:
                return {id: this.id, type: this.type, play: this.initialState as boolean};
            case OutputDeviceType.COIL:
                return {id: this.id, type: this.type, state: this.initialState as boolean};
            case OutputDeviceType.LIGHT:
                return {id: this.id, type: this.type, state: this.initialState as LightState};
        }
    }
}