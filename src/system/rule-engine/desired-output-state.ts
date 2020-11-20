import { LightState } from "../devices/light";
import { OUTPUT_DEVICE_TYPES } from "../devices/output-device";
import { CoilOutputState, LightOutputState, OutputDeviceState, SoundOutputState } from "./schema/rule.schema";

export declare type DesiredOutputStateType = LightState | boolean;

export class DesiredOutputState {
    private currentState: DesiredOutputStateType;
    
    static constructFromOutputState(ouputState: LightOutputState | CoilOutputState | SoundOutputState) {
        switch(ouputState.type) {
            case OUTPUT_DEVICE_TYPES.SOUND:
                return new DesiredOutputState(
                    ouputState.id, ouputState.type, ouputState.play
                );
            default:
                return new DesiredOutputState(
                    ouputState.id, ouputState.type, ouputState.state
                );
        }
    }
    
    constructor(public readonly id: string, public readonly type: OUTPUT_DEVICE_TYPES, private readonly initialState: DesiredOutputStateType) {
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
            case OUTPUT_DEVICE_TYPES.SOUND:
                return {id: this.id, type: this.type, play: this.initialState as boolean};
            case OUTPUT_DEVICE_TYPES.COIL:
                return {id: this.id, type: this.type, state: this.initialState as boolean};
            case OUTPUT_DEVICE_TYPES.LIGHT:
                return {id: this.id, type: this.type, state: this.initialState as LightState};
        }
    }
}