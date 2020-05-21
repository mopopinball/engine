const Light = require('./light');
const {MessageBroker} = require('../system/messages');

const LAMP_ROLES = {
    LAMP: 'lamp',
    COIL: 'coil'
};

/**
 * todo
 */
class PlayfieldLamp extends Light {
    constructor(number, role, name) {
        super();
        this.number = number;
        this.role = role;
        this.name = name;
    }

    on() {
        super.on();
        // this._markDirty();
        // this._publish();
    }

    off() {
        super.off();
        // this._markDirty();
        // this._publish();
    }

    state(state) {
        this.clearTimers();
        if (state) {
            this.on();
        }
        else {
            this.off();
        }
    }

    _publish() {
        MessageBroker.publish(`mopo/devices/lamps/${this.number}/state`, this.isOn.toString());
    }
}

module.exports = {PlayfieldLamp, LAMP_ROLES};
