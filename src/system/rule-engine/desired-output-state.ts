import { LightState } from "../devices/light";
import { OUTPUT_DEVICE_TYPES } from "../devices/output-device";

export declare type DesiredOutputStateType = LightState | boolean;

export class DesiredOutputState {
    private currentState: DesiredOutputStateType;
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
}