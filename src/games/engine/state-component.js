const DeviceQueue = require('./device-queue');

/**
 * @abstract
 * A state controller
 */
class StateComponent {
    constructor(stateName) {
        if (!stateName) {
            throw new Error('stateName not provided');
        }
        this.stateName = stateName;
        this.active = false;
        this.deviceQueue = new DeviceQueue();
    }

    enter() {
        this.active = true;
    }

    leave() {
        this.active = false;
    }

    reset() {
        this.active = false;
    }

    /**
     * Registers the given event to the given obj's "on" event and calls the given callback]
     * only when this StateComponent is "active".
     * @param {*} obj The object with an "on" event to register to.
     * @param {String} event The event name to register to.
     * @param {Function} callback The callback function which will only be called when this
     * instance is "active".
     */
    onEvent(obj, event, callback) {
        obj.on(event, (arg) => {
            if (this.active) {
                callback(arg);
            }
        });
    }
};

module.exports = StateComponent;
