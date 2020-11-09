import { OutputDevice, OUTPUT_DEVICE_TYPES } from "./output-device";

/**
 * Sounds work by setting the sound data on the sound lines, then triggering an inerrupt by going low.
 * When this sound goes on(), we'll emit our dirty flag, which is processed and sent to the pic loading
 * the data. When the on() call is ack'd, we'll immediatly turn ourselves off, which will emit
 * dirty for the next clock tick, thus sending the sound interrupt.
 */
export class Sound extends OutputDevice {
    constructor(id: string, public readonly number: number, description: string) {
        super(id, description, OUTPUT_DEVICE_TYPES.SOUND);
    }

    ackDirty(ackOn: boolean): void {
        super.ackDirty(ackOn);
        if(ackOn) {
            this.off();
        }
    }

    public getNumber(): number {
        return this.number;
    }
}
