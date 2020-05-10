const {MessageBroker} = require('../modules/messages');
const EventEmitter = require('events');
// const logger = require('../util/logger');

/**
 * An abstract switch.
 * @abstract
 */
class Switch extends EventEmitter {
    constructor(id, activeLow, debounceIntervalMs = 100) {
        super();
        if (!id) {
            throw new Error('Provide an id');
        }
        // TODO: Check the id isnt in messages.EVENTS.
        this.id = id;
        this.activeLow = activeLow;
        this.debounceIntervalMs = debounceIntervalMs;
        this.lastActiveTime = 0;

        this.active = null;
        this._ack = null;
    }

    hasChanged() {
        return this.active !== this._ack;
    }

    getActive() {
        // todo debounce
        if (this.active !== this._ack) {
            this._ack = this.active;
            return this.active;
        }
        else {
            return false;
        }
    }

    onChange(value) {
        const realValue = this.activeLow ? !value : value;
        // TODO: Maybe only set to true, allow getActive() to reset it.
        this.active = realValue;
        // we always want 'true' to indicate the switch is activated.
        // If the switch is active low, that is, it goes low when activated/pressed/closed, invert its output
        // here.
        // const realValue = this.activeLow ? !value : value;

        // const now = this._getNow();
        // const diff = now - this.lastActiveTime;
        // if (realValue && diff >= this.debounceIntervalMs) {
        //     this.lastActiveTime = now;
        //     this._publish(realValue);
        // }
        // else if (realValue) {
        // eslint-disable-next-line max-len
        //     logger.info(`Switch "${this.id}" activation ignored because it was ${diff} ms since last activation. Debounce set to ${this.debounceIntervalMs}.`);
        // }
        // else if (!realValue) {
        //     this._publish(realValue);
        // }

        this._publish(realValue);
        // this.active = realValue;
    }

    _publish(realValue) {
        this.emit('change', realValue);
        if (realValue) {
            this.emit('active', realValue);
        }
        MessageBroker.publish(`mopo/devices/${this.id}/state`, realValue.toString());
    }

    _getNow() {
        return new Date().valueOf();
    }
}

module.exports = Switch;
