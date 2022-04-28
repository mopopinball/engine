/**
 * A collection of devices with on/off states.
 */
class OutputDeviceCollection {
    constructor(collection) {
        this.collection = collection;
        this.blinkInterval = null;
    }

    set() {
        this.collection.forEach((c) => c.set());
    }

    toggle() {
        this.collection.forEach((c) => c.toggle());
    }

    blink(intervalMs) {
        this.blinkStop();
        this.blinkInterval = setInterval(() => {
            this.toggle();
        }, intervalMs);
    }

    blinkStop() {
        clearInterval(this.blinkInterval);
    }
}

module.exports = OutputDeviceCollection;
