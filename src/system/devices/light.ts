import { OutputDevice } from "./output-device";
import { OutputDeviceType } from "./output-device-type";
import { Style } from "./styles/style";

export enum LightState {
    OFF,
    ON
}

/**
 * An abstract light.
 */
export class Light extends OutputDevice {
    protected styleState?: LightState;

    constructor(
        id: string,
        name: string,
        protected state: LightState,
        private styles: Style[] = []
    ) {
        super(id, name, OutputDeviceType.LIGHT);
        this.setState(state);
    }

    setStyles(styles: Style[]): void {
        this.styles = styles;
    }
    
    setState(state: LightState, stateParam?: number): void {
        this.state = state;
        if (state === LightState.ON) {
            this.on();
        }
        else if (state === LightState.OFF) {
            this.off();
        }
    }

    getState(): LightState {
        return this.styleState ?? this.state;
    }

    set(): void {
        if (this.isOn) {
            this.on();
        }
        else {
            this.off();
        }
    }

    on(): void {
        super.on();
    }

    off(): void {
        super.off();
    }

    toggle(): void {
        if (this.isOn) {
            this.off();
        }
        else {
            this.on();
        }
    }

    getNumber(): number {
        return null;
    }

    public update(): void {
        const init = this.styleState;
        for(const style of this.styles) {
            this.styleState = style.update() as LightState;
        }
        if (init !== this.styleState) {
            if (this.styleState === LightState.ON) {
                this.on();
            }
            else if (this.styleState === LightState.OFF) {
                this.off();
            }
        }
    }
}