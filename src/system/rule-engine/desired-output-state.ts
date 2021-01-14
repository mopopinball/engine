import { LightState } from "../devices/light";
import { OutputDeviceType } from "../devices/output-device-type";
import { BlinkLightStyle } from "../devices/styles/blink-light-style";
import { Style } from "../devices/styles/style";
import { OutputStateType } from "./schema/rule.schema";

export declare type DesiredOutputStateType = LightState | boolean | string;

export class DesiredOutputState {
    private currentState: DesiredOutputStateType;
    private preTempState: DesiredOutputStateType;
    public temp = false;
    
    static constructFromOutputState(ouputState: OutputStateType): DesiredOutputState {
        switch(ouputState.type) {
            case OutputDeviceType.SOUND:
                return new DesiredOutputState(
                    ouputState.id, ouputState.type, ouputState.play
                );
                case OutputDeviceType.LIGHT: {
                    const styles = [];
                    const style = BlinkLightStyle.build(ouputState.style);
                    if (style) {
                        styles.push(style);
                    }
                    
                    return new DesiredOutputState(
                        ouputState.id, ouputState.type, ouputState.state, styles
                    );
                }
                case OutputDeviceType.DISPLAY:
                    return new DesiredOutputState(
                        ouputState.id, ouputState.type, ouputState.state
                    );
            default:
                return new DesiredOutputState(
                    ouputState.id, ouputState.type, ouputState.state
                );
        }
    }
    
    constructor(
        public readonly id: string,
        public readonly type: OutputDeviceType,
        // public readonly coilType: CoilType,
        private initialState: DesiredOutputStateType,
        public styles: Style[] = []
    ) {
        this.currentState = initialState;
    }

    setInitialState(state: DesiredOutputStateType): void {
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
        if (setByAction && !this.isInstantState()) {
            this.preTempState = this.currentState;
            this.temp = true;
        } else {
            this.temp = false;
        }
        this.currentState = state;
        
    }

    // determines if this desired output state is instanious (eg. a coil or sound.)
    public isInstantState(): boolean {
        // TODO: This should check if the coil is a relay.
        // TODO: It also needs to check if its a lamp in coil role.
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

    toJSON(): OutputStateType {
        switch(this.type) {
            case OutputDeviceType.SOUND:
                return {id: this.id, type: this.type, play: this.initialState as boolean};
            case OutputDeviceType.COIL:
                return {id: this.id, type: this.type, state: this.initialState as boolean};
            case OutputDeviceType.LIGHT:
                return {id: this.id, type: this.type, state: this.initialState as LightState};
            case OutputDeviceType.DISPLAY:
                return {id: this.id, type: this.type, state: this.initialState as string};
        }
    }
}