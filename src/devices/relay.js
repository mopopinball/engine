const {Coil} = require('./coil');

/**
 * A toggle relay.
 */
class Relay extends Coil {
    constructor(number, name, driverType) {
        super(number, name, driverType, null);
    }

    on() {
        this.isOn = true;
        this._markDirty();
    }

    toggle() {
        if (this.isOn) {
            this.off();
        }
        else {
            this.on();
        }
    }
}

module.exports = Relay;
