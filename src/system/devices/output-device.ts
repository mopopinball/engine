import { DirtyNotifier } from "../dirty-notifier";
import { OutputDeviceType } from "./output-device-type";

/**
 * An output device which is controled by the driver PIC.
 */
export abstract class OutputDevice extends DirtyNotifier {
    public isOn: boolean;
    // the two ack flags. They start ack'd.
    private onAckd = true;
    private offAckd = true;

    constructor(public readonly id: string, public readonly name: string, public readonly type: OutputDeviceType) {
        super();
    }

    on(): void {
        // logger.debug(`${this.name} on`);
        this.onWorker();
    }

    private onWorker(): void {
        this.isOn = true;
        this.onAckd = false;
        this.emitDirty();
    }

    off(): void {
        // logger.debug(`${this.name} off`);
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

    public abstract update(): void;

    public abstract getNumber(): number;
}