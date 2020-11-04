import { DirtyNotifier } from "../system/dirty-notifier";

// const logger = require('../util/logger');
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
    public ackOn = true;
    public ackOff = true;
    dirtyFlag: boolean;

    constructor(public readonly type: OUTPUT_DEVICE_TYPES) {
        super();
    }

    on(): void {
        this.isOn = true;
        this.ackOn = null;
        this.emitDirty();
    }

    off(): void {
        this.isOn = false;
        this.ackOff = null;
        this.emitDirty();
    }

    _markDirty(): void {
        // todo used by sound, cleanup
        this.dirtyFlag = true;
        this.ackOn = null;
        this.emitDirty();
        // MessageBroker.emit(EVENTS.OUTPUT_DEVICE_DIRTY, this);
    }

    isDirty(): boolean {
        return !this.ackOn || !this.ackOff;
    }

    ackDirty(ackOn: boolean): void {
        // todo used by sound, cleanup
        this.dirtyFlag = false;
        if (ackOn) {
            this.ackOn = true;
        }
        else {
            this.ackOff = true;
        }
    }
}