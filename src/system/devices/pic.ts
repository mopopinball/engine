import { BytesWritten, PromisifiedBus } from "i2c-bus";
import {openPromisified} from 'i2c-bus';
import { logger } from "../logger";
import { spawnSync, SpawnSyncReturns } from "child_process";
import {padStart} from 'lodash';
import { existsSync, readFileSync } from "fs";

/**
 * An abstract PIC.
 */
export abstract class Pic {
    private readonly picPath = '/home/pi/mopo/pics';
    protected i2c1: PromisifiedBus;
    protected readonly DEBUG = false;

    constructor(private readonly picAddress: number, private name: string) {
    }

    async setup(): Promise<void> {
        this.i2c1 = await this.openConnection();
        const addresses = await this.scan();
        logger.debug(`${this.name}: Found i2c devices: ${JSON.stringify(addresses)}`);
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

    protected logBuffer(buffer: Buffer): void {
        if (this.DEBUG) {
            let log = '';
            buffer.forEach((b) => {
                log += `[${this.dec2bin(b, 8)}]`;
            });
            logger.debug(log);
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
