import { LightState } from "../devices/light";
import { OutputDeviceType } from "../devices/output-device-type";
import { BlinkDisplayStyle } from "../devices/styles/blink-display-style";
import { BlinkLightStyle } from "../devices/styles/blink-light-style";
import { Style } from "../devices/styles/style";
import { DisplayOutputState, LightOutputState, OutputStateType } from "./schema/rule.schema";

export declare type DesiredOutputStateType = LightState | boolean | string;

export class DesiredOutputState {
    private currentState: DesiredOutputStateType;
    private preTempState: DesiredOutputStateType;
    public temp = false;
    
    static constructFromOutputState(outputState: OutputStateType): DesiredOutputState {
        switch(outputState.type) {
        case OutputDeviceType.SOUND:
            return new DesiredOutputState(
                outputState.id, outputState.type, outputState.play
            );
        case OutputDeviceType.LIGHT: {
            // TODO: Make better
            const styles = [];
            const style = BlinkLightStyle.build(outputState.style);
            if (style) {
                styles.push(style);
            }
                    
            return new DesiredOutputState(
                outputState.id, outputState.type, outputState.state, styles
            );
        }
        case OutputDeviceType.DISPLAY: {
            // TODO: Make better
            const styles = [];
            const style = BlinkDisplayStyle.build(outputState.state, outputState.style);
            if (style) {
                styles.push(style);
            }

            return new DesiredOutputState(
                outputState.id, outputState.type, outputState.state, styles
            );
        }
        default:
            return new DesiredOutputState(
                outputState.id, outputState.type, outputState.state
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
        }
        else {
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
        case OutputDeviceType.LIGHT: {
            const response: LightOutputState = {
                id: this.id, type: this.type,
                state: this.initialState as LightState
            };
                // TODO: Make this better.
            if (this.styles?.length) {
                response.style = {};
            }
            this.styles.forEach((s) => {
                if (s instanceof BlinkLightStyle) {
                    response.style['blink'] = s.interval;
                }
            });
            return response;
        }
        case OutputDeviceType.DISPLAY: {
            const response: DisplayOutputState = {
                id: this.id,
                type: this.type,
                state: this.initialState as string
            };
                // TODO: Make this better.
            if (this.styles?.length) {
                response.style = {};
            }
            this.styles.forEach((s) => {
                if (s instanceof BlinkDisplayStyle) {
                    response.style['blink'] = s.interval;
                }
            });
            return response;
        }
        }
    }
}