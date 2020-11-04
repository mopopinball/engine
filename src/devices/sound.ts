import { OutputDevice, OUTPUT_DEVICE_TYPES } from "./output-device";

export enum SoundState {
    PLAYING,
    ACK,
    DONE
}

/**
 * Sounds work by setting the sound data on the sound lines, then triggering and inerrupt by going low.
 * When this sound goes on(), we'll emit our dirty flag, which is processed and sent to the pic. Then,
 * on the later in the clock tick that on() call will be ack'd. While ack'ing that, immediatly turn
 * ourselves off, which will emit dirty for the next clock tick, thus sending the sound interrupt.
 */
export class Sound extends OutputDevice {
    constructor(public readonly number: number, public readonly description: string) {
        super(OUTPUT_DEVICE_TYPES.SOUND);
    }

    ackDirty(ackOn: boolean): void {
        super.ackDirty(ackOn);
        if(ackOn) {
            this.off();
        }
    }
}
