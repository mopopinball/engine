import { DirtyNotifier } from "../dirty-notifier";

export enum OUTPUT_DEVICE_TYPES {
    LIGHT = 'light',
    COIL = 'coil',
    SOUND = 'sound'
}

/**
 * An output device which is controled by the driver PIC.
 */
export abstract class OutputDevice extends DirtyNotifier {
    public isOn: boolean;
    // the two ack flags. They start ack'd.
    private onAckd = true;
    private offAckd = true;

    constructor(public readonly id: string, public readonly type: OUTPUT_DEVICE_TYPES) {
        super();
    }

    on(): void {
        this.onWorker();
    }

    private onWorker(): void {
        this.isOn = true;
        this.onAckd = false;
        this.emitDirty();
    }

    off(): void {
        this.isOn = false;
        this.offAckd = false;
        this.emitDirty();
    }

    protected superOn(): void {
        this.onWorker();
    }

    isOnAckd(): boolean {
        return this.onAckd;
    }

    isOffAckd(): boolean {
        return this.offAckd;
    }

    ackDirty(ackOn: boolean): void {
        if (ackOn) {
            this.onAckd = true;
        }
        else {
            this.offAckd = true;
        }
    }
}