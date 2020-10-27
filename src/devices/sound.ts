import { OutputDevice, OUTPUT_DEVICE_TYPES } from "./output-device";

/** A sound */
export class Sound extends OutputDevice {
    private state: string;
    
    constructor(public number: number, private description: string) {
        super(OUTPUT_DEVICE_TYPES.SOUND);
        // this.playing = false;
        this.state = null;
    }

    play(): void {
        // this.playing = true;
        this.state = 'playing';
        this._markDirty();
    }

    ack(): void {
        // this.playing = false;
        this.state = 'ack';
        this._markDirty();
    }

    done(): void {
        this.state = 'done';
    }

    dirty(): boolean {
        return this.state !== null;
    }
}
