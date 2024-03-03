import { logger } from "../logger";
import GPIO, {promise as gpiop} from 'rpi-gpio';

/**
 * A GPIO pin.
 */
export class GpioPin {
    private static instances: GpioPin[] = [];

    private state: boolean;
    private setupComplete: boolean;
    
    constructor(
        private readonly pinNumber: number,
        private readonly direction: 'in' | 'out' | 'low' | 'high',
        private readonly edge: 'none' | 'rising' | 'falling' | 'both' = 'none'
    ) {
        if (!pinNumber) {
            throw new Error('Provide a pin number');
        }
        if (this.direction === gpiop.DIR_LOW) {
            this.state = false;
        }
        else if (this.direction === gpiop.DIR_HIGH) {
            this.state = true;
        }

        GpioPin.instances.push(this);
    }

    /**
     * Sets up the pins sequentially, not concurrently.
     */
    static async setupSync(): Promise<void> {
        logger.info(`Setting up ${GpioPin.instances.length} GPIO pins.`);
        GpioPin.instances.sort((a, b) => a.pinNumber > b.pinNumber ? 1 : -1);
        for (let i = 0; i < GpioPin.instances.length; i++) {
            try {
                await GpioPin.instances[i].setup();
            }
            catch (e) {
                i = i - 1;
            }
        }
        logger.info('GPIO setup complete.');
    }

    async setup(): Promise<void> {
        try {
            this.setupComplete = false;
            logger.info(`Setting up GPIO pin ${this.pinNumber} as ${this.direction}.`);
            return await gpiop.setup(this.pinNumber, this.direction, this.edge)
                .then(() => {
                    this.setupComplete = true;
                });
        }
        catch (e) {
            logger.error(new Error(`Failed to setup pin ${this.pinNumber} as ${this.direction}. Retrying...`));
            throw e;
        }
    }

    async toggle(): Promise<unknown> {
        return await this.write(!this.state);
    }

    async writeHigh(): Promise<void> {
        await this.write(true);
    }

    async writeLow(): Promise<void> {
        await this.write(false);
    }

    async write(state: boolean): Promise<void> {
        if (!this.setupComplete) {
            logger.warn(`GPIO pin ${this.pinNumber} is not setup.`);
            return;
        }
        await gpiop.write(this.pinNumber, state);
        this.state = state;
    }

    async read(): Promise<boolean> {
        if (!this.setupComplete) {
            logger.warn(`GPIO pin ${this.pinNumber} is not setup.`);
            return undefined;
        }
        return await gpiop.read(this.pinNumber);
    }

    on(listener: (...args: any[]) => void): void {
        // GPIO.on fires for all gpio pin changes. Only re-emit when its changed for our pin.
        GPIO.on('change', (channel, value) => {
            if (channel === this.pinNumber) {
                listener(value);
            }
        });
    }
}
