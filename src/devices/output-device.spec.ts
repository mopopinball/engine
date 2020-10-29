import { OutputDevice, OUTPUT_DEVICE_TYPES } from "./output-device";

describe('output device', () => {
    let outputDevice: TestOutputDevice;

    beforeEach(() => {
        outputDevice = new TestOutputDevice();
    });

    it('on() sets appropriate flags', () => {
        // exercise
        outputDevice.on();

        // check
        expect(outputDevice.isOn).toBeTruthy();
        expect(outputDevice.ackOn).toBeNull();
        expect(outputDevice.ackOff).toBeTruthy();
    });
    
    it('off() sets appropriate flags', () => {
        // exercise
        outputDevice.off();

        // check
        expect(outputDevice.isOn).toBeFalsy();
        expect(outputDevice.ackOn).toBeTruthy();
        expect(outputDevice.ackOff).toBeNull();
    });

    it('is dirty if turned on', () => {
        // setup
        outputDevice.on();

        // exercise
        const isDirty = outputDevice.isDirty();

        // check
        expect(isDirty).toBeTruthy();
    });

    it('is dirty if turned off', () => {
        // setup
        outputDevice.off();

        // exercise
        const isDirty = outputDevice.isDirty();

        // check
        expect(isDirty).toBeTruthy();
    });

    it('is not dirty if acked', () => {
        // setup
        outputDevice.on();
        outputDevice.ackDirty(true);

        // exercise
        const isDirty = outputDevice.isDirty();

        // check
        expect(isDirty).toBeFalsy();
    });

    it('is not dirty if acked', () => {
        // setup
        outputDevice.off();
        outputDevice.ackDirty(false);

        // exercise
        const isDirty = outputDevice.isDirty();

        // check
        expect(isDirty).toBeFalsy();
    });
});

class TestOutputDevice extends OutputDevice {
    constructor() {
        super(OUTPUT_DEVICE_TYPES.LIGHT);
    }
}