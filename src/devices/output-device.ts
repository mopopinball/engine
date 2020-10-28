// const logger = require('../util/logger');
export enum OUTPUT_DEVICE_TYPES {
    LIGHT,
    COIL,
    SOUND
}

/**
 * An output device which is controled by the driver PIC.
 */
export class OutputDevice {
    public isOn: boolean;
    public ackOn: boolean;
    public ackOff: boolean;
    dirtyFlag: boolean;

    constructor(public readonly type: OUTPUT_DEVICE_TYPES) {
        // if (Object.keys(OUTPUT_DEVICE_TYPES).indexOf(type) < 0) {
        //     throw new Error('Invalid output object type.');
        // }
    }

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

    ackDirty(ackOn): void {
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