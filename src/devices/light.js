const {OutputDevice, OUTPUT_DEVICE_TYPES} = require('./output-device');

/**
 * An abstract light.
 */
class Light extends OutputDevice {
    constructor(initiallyOn) {
        super(OUTPUT_DEVICE_TYPES.LIGHT);
        if (initiallyOn) {
            this.on();
        }
        this.blinkInterval = null;
    }

    set() {
        if (this.isOn) {
            this.on();
        }
        else {
            this.off();
        }
    }

    on() {
        super.on();
    }

    off() {
        super.off();
    }

    toggle() {
        if (this.isOn) {
            this.off();
        }
        else {
            this.on();
        }
    }

    pulse(pulseDurationMs) {
        this.on();
        clearTimeout(this.pulseTimeout);
        this.pulseTimeout = setTimeout(() => this.off(), pulseDurationMs);
    }

    blink(intervalMs) {
        this.blinkStop();
        this.blinkInterval = setInterval(() => {
            this.toggle();
        }, intervalMs);
    }

    clearTimers() {
        clearInterval(this.blinkInterval);
        clearTimeout(this.pulseTimeout);
    }
}

module.exports = Light;
