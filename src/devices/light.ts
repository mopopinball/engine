import { OutputDevice, OUTPUT_DEVICE_TYPES } from "./output-device";

export enum LightState {
    OFF,
    ON,
    BLINK
}

/**
 * An abstract light.
 */
export class Light extends OutputDevice {
    blinkInterval: NodeJS.Timeout;
    pulseTimeout: NodeJS.Timeout;

    constructor(protected state: LightState) {
        super(OUTPUT_DEVICE_TYPES.LIGHT);
        if (state === LightState.ON) {
            this.on();
        }
        this.blinkInterval = null;
    }
    
    setState(state: LightState): void {
        this.clearTimers();
        this.state = state;
        if (state === LightState.ON) {
            this.on();
        }
        else if (state === LightState.OFF) {
            this.off();
        }
        else if (state === LightState.BLINK) {
            // TODO
        }
        else {
            throw new Error('not impl');
        }
    }

    getState(): LightState {
        return this.state;
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

    pulse(pulseDurationMs: number): void {
        this.on();
        clearTimeout(this.pulseTimeout);
        this.pulseTimeout = setTimeout(() => this.off(), pulseDurationMs);
    }

    // blink(intervalMs): void {
    //     this.blinkStop();
    //     this.blinkInterval = setInterval(() => {
    //         this.toggle();
    //     }, intervalMs);
    // }

    clearTimers(): void {
        clearInterval(this.blinkInterval);
        clearTimeout(this.pulseTimeout);
    }
}