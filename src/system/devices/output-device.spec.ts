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
        expect(outputDevice.isOnAckd()).toBeFalsy();
        expect(outputDevice.isOffAckd()).toBeTruthy();
    });
    
    it('off() sets appropriate flags', () => {
        // exercise
        outputDevice.off();

        // check
        expect(outputDevice.isOn).toBeFalsy();
        expect(outputDevice.isOnAckd()).toBeTruthy();
        expect(outputDevice.isOffAckd()).toBeFalsy();
    });
});

class TestOutputDevice extends OutputDevice {
    constructor() {
        super(OUTPUT_DEVICE_TYPES.LIGHT);
    }
}