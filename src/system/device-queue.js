// const logger = require('../../util/logger');

/**
 * Performs device operations in a queue.
 */
class DeviceQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
    }

    push(device) {
        if (device instanceof Array) {
            device.forEach((d) => this.push(d));
            return;
        }
        this.queue.push({
            state: null,
            device: device
        });
    }

    update() {
        this._processFirst();
    }

    async _processFirst() {
        if (this.queue.length === 0 || this.processing) {
            return;
        }

        this.processing = true;

        // const first = this.queue[0];

        // if (first.state) {
        //     return;
        // }

        while (this.queue.length > 0) {
            const item = this.queue.shift();
            await this._process(item);
        }

        this.processing = false;
        // for (let i = 0; i < this.queue.length; i++) {
        //     await this._process(this.queue[i]);
        // }

        // if (!first.state) {
        //     logger.debug(`Processing ${first.device.name}`);
        //     first.state = 'processed';
        //     this._process(first);
        // }
        // else if (first.state === 'processed' && !first.device.isOn) {
        //     logger.debug(`Done processing ${first.device.name}`);
        //     this.queue.shift();
        // }
    }

    async _process(item) {
        item.state = 'processed';
        if (typeof item.device === 'function') {
            return item.device();
        }
        else {
            return item.device.on();
        }
    }
}

module.exports = DeviceQueue;
