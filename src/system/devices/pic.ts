import { BytesWritten, PromisifiedBus } from "i2c-bus";
import * as i2c from 'i2c-bus';
import { logger } from "../logger";
import { spawnSync, SpawnSyncReturns } from "child_process";
import {padStart} from 'lodash';

/**
 * An abstract PIC.
 */
export abstract class Pic {
    protected i2c1: PromisifiedBus;
    protected readonly DEBUG = true;

    constructor(private readonly picAddress: number, private name: string) {
    }

    async setup(): Promise<void> {
        this.i2c1 = await this.openConnection();
        const addresses = await this.scan();
        logger.debug(`${this.name}: Found i2c devices: ${JSON.stringify(addresses)}`);
    }

    async openConnection(): Promise<PromisifiedBus> {
        return i2c.openPromisified(1);
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

    programHex(pathToHexFile: string): SpawnSyncReturns<string> {
        // todo
        const result = spawnSync('picpgm', ['-p', pathToHexFile], {stdio: 'pipe', encoding: 'utf-8'});
        logger.info(result.stdout);
        return result;
    }

    protected logBuffer(buffer: Buffer): void {
        if (this.DEBUG) {
            let log = '';
            buffer.forEach((b) => {
                log += `[${this.dec2bin(b, 8)}]`;
            });
            logger.debug(log);
        }
    }

    // compareHex(pathToHexFile: string): void {
    //     // todo
    // }
}
