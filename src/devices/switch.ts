import { EventEmitter } from "events";
import { MessageBroker } from "../system/messages";

// const {MessageBroker} = require('../system/messages');
// const EventEmitter = require('events');
// const logger = require('../system/logger');

/**
 * An abstract switch.
 */
export abstract class Switch extends EventEmitter {
    protected lastActiveTime = 0;
    protected active: boolean;
    private ack: boolean;

    constructor(
        public readonly id: string, protected readonly activeLow: boolean,
        protected readonly debounceIntervalMs: number = 100
    ) {
        super();
        if (!id) {
            throw new Error('Provide an id');
        }
        // TODO: Check the id isnt in messages.EVENTS.

    }

    hasChanged(): boolean {
        return this.active !== this.ack;
    }

    getActive(): boolean {
        // todo debounce
        if (this.active !== this.ack) {
            this.ack = this.active;
            return this.active;
        }
        else {
            return false;
        }
    }

    onChange(value: boolean): void {
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

    _publish(realValue: boolean): void {
        this.emit('change', realValue);
        if (realValue) {
            this.emit('active', realValue);
        }
        MessageBroker.getInstance().publish(`mopo/devices/${this.id}/state`, realValue.toString());
    }

    _getNow(): number {
        return new Date().valueOf();
    }
}
