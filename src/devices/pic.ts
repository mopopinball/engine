import { BytesWritten, PromisifiedBus } from "i2c-bus";
import * as i2c from 'i2c-bus';
import { logger } from "../system/logger";
import { spawnSync, SpawnSyncReturns } from "child_process";

/**
 * An abstract PIC.
 */
export abstract class Pic {
    protected i2c1: PromisifiedBus;

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

    dec2bin(dec: number): string {
        return (dec >>> 0).toString(2);
    }

    programHex(pathToHexFile: string): SpawnSyncReturns<string> {
        // todo
        const result = spawnSync('picpgm', ['-p', pathToHexFile], {stdio: 'pipe', encoding: 'utf-8'});
        logger.info(result.stdout);
        return result;
    }

    // compareHex(pathToHexFile: string): void {
    //     // todo
    // }
}
