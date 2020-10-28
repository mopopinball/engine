import { OutputDevice, OUTPUT_DEVICE_TYPES } from "./output-device";

export enum SoundState {
    PLAYING,
    ACK,
    DONE
}

/** A sound */
export class Sound extends OutputDevice {
    public state: SoundState;
    
    constructor(public number: number, private description: string) {
        super(OUTPUT_DEVICE_TYPES.SOUND);
        // this.playing = false;
        this.state = null;
    }

    play(): void {
        // this.playing = true;
        this.state = SoundState.PLAYING;
        this._markDirty();
    }

    ack(): void {
        // this.playing = false;
        this.state = SoundState.ACK;
        this._markDirty();
    }

    done(): void {
        this.state = SoundState.DONE;
    }

    dirty(): boolean {
        return this.state !== null;
    }
}
