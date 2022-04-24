import { BytesWritten, PromisifiedBus } from "i2c-bus";
import {openPromisified} from 'i2c-bus';
import { logger } from "../logger";
import {padStart} from 'lodash';
import { existsSync, readFileSync } from "fs";

/**
 * An abstract PIC.
 */
export abstract class Pic {
    private readonly picPath = '/home/pi/mopo/pics';
    protected i2c1: PromisifiedBus;

    constructor(private readonly picAddress: number, protected readonly name: string) {
        logger.info(`Constructing ${name} PIC.`);
    }

    async setup(): Promise<void> {
        this.i2c1 = await this.openConnection();
        const addresses = await this.scan();
        logger.info(`${this.name}: Found I2C devices: ${JSON.stringify(addresses)}. Our address: ${this.picAddress}`);
    }

    async openConnection(): Promise<PromisifiedBus> {
        
        return openPromisified(1);
    }

    async scan(): Promise<number[]> {
        return this.i2c1.scan();
    }

    async write(buffer: Buffer): Promise<BytesWritten> {
        if (!this.i2c1) {
            logger.error('I2C not ready to write');
            return;
        }
        return this.i2c1.i2cWrite(this.picAddress, buffer.length, buffer);
    }

    dec2bin(dec: number, size: number): string {
        return padStart((dec >>> 0).toString(2), size, '0');
    }

    protected logBuffer(format: string, buffer: Buffer): void {
        if (logger.getLevel() <= logger.levels.TRACE) {
            logger.trace(format);
            let log = '';
            buffer.forEach((b) => {
                log += `[${this.dec2bin(b, 8)}]`;
            });
            logger.trace(log);
        }
    }

    protected getInstalledVersion(pic: string): string {
        const path = `${this.picPath}/${pic}-version.json`;
        if (!existsSync(path)) {
            return null;
        }
        const manifest = JSON.parse(readFileSync(path, {encoding: 'utf8'}));
        return manifest.version;
    }

}
