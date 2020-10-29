// const logger = require('../util/logger');
export enum OUTPUT_DEVICE_TYPES {
    LIGHT,
    COIL,
    SOUND
}

/**
 * An output device which is controled by the driver PIC.
 */
export abstract class OutputDevice {
    public isOn: boolean;
    // the two ack flags. They start ack'd.
    public ackOn = true;
    public ackOff = true;
    dirtyFlag: boolean;

    constructor(public readonly type: OUTPUT_DEVICE_TYPES) {}

    on(): void {
        this.isOn = true;
        this.ackOn = null;
    }

    off(): void {
        this.isOn = false;
        this.ackOff = null;
    }

    _markDirty(): void {
        // todo used by sound, cleanup
        this.dirtyFlag = true;
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