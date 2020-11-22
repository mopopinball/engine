import { LightState } from "../devices/light";
import { OutputDeviceType } from "../devices/output-device-type";
import { CoilOutputState, LightOutputState, OutputDeviceState, SoundOutputState } from "./schema/rule.schema";

export declare type DesiredOutputStateType = LightState | boolean;

export class DesiredOutputState {
    private currentState: DesiredOutputStateType;
    
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
    
    constructor(public readonly id: string, public readonly type: OutputDeviceType, private readonly initialState: DesiredOutputStateType) {
        this.currentState = initialState;
    }

    getState(): DesiredOutputStateType {
        return this.currentState;
    }

    setState(state: DesiredOutputStateType): void {
        this.currentState = state;
    }

    reset(): void {
        this.currentState = this.initialState;
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