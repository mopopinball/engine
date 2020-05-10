const gpiop = require('rpi-gpio').promise;
const logger = require('../util/logger');
const {MessageBroker, EVENTS} = require('../modules/messages');

/**
 * A GPIO pin.
 * The three static methods are to ensure gpio pins are setup sequentially, not concurrently.
 */
class GpioPin {
    constructor(pinNumber, direction, edge = gpiop.EDGE_NONE) {
        if (!pinNumber) {
            throw new Error('Provide a pin number');
        }
        this.pinNumber = pinNumber;
        this.direction = direction;
        if (this.direction === gpiop.DIR_LOW) {
            this.state = false;
        }
        else if (this.direction === gpiop.DIR_HIGH) {
            this.state = true;
        }
        this.edge = edge;
        GpioPin.register(this);
    }

    static staticConstructor() {
        if (!GpioPin.instances) {
            GpioPin.instances = [];
            MessageBroker.on(EVENTS.SETUP_GPIO, () => GpioPin.setupSync());
        }
    }

    static register(instance) {
        GpioPin.instances.push(instance);
    }

    static async setupSync() {
        logger.info('Setting up all gpio pins.');
        for (let i = 0; i < GpioPin.instances.length; i++) {
            try {
                await GpioPin.instances[i].setup();
            }
            catch (e) {
                i = i - 1;
            }
        }
        logger.info('GPIO setup complete.');
        MessageBroker.emit(EVENTS.SETUP_GPIO_COMPLETE);
    }

    async setup() {
        try {
            this.setupComplete = false;
            logger.info(`Setting up GPIO pin ${this.pinNumber} as ${this.direction}.`);
            await gpiop.setup(this.pinNumber, this.direction, this.edge);
            this.setupComplete = true;
        }
        catch (e) {
            logger.error(new Error(`Failed to setup pin ${this.pinNumber} as ${this.direction}. Retrying...`, e));
            throw e;
        }
    }

    async toggle() {
        await this.write(!this.state);
    }

    async writeHigh() {
        await this.write(true);
    }

    async writeLow() {
        await this.write(false);
    }

    async write(state) {
        if (!this.setupComplete) {
            logger.warn(`GPIO pin ${this.pinNumber} is not setup.`);
            return;
        }
        await gpiop.write(this.pinNumber, state);
        this.state = state;
    }

    async read() {
        if (!this.setupComplete) {
            logger.warn(`GPIO pin ${this.pinNumber} is not setup.`);
            return undefined;
        }
        return await gpiop.read(this.pinNumber);
    }
}

// Since node doesnt support static constructors, we'll manually call it here.
GpioPin.staticConstructor();

module.exports = GpioPin;
