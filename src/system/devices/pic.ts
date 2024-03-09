import { BytesWritten, PromisifiedBus } from "i2c-bus";
import {openPromisified} from 'i2c-bus';
import { logger } from "../logger";
import {padStart} from 'lodash';
import { existsSync, readFileSync } from "fs";
import { picPathAvailable, picPathInstalled } from "../constants";
import { join } from "path";
import { execSync } from "child_process";

/**
 * An abstract PIC.
 */
export abstract class Pic {
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

    updateRequired(pic: string): boolean {
        return this.getInstalledVersion(pic) !== this.getAvailableVersion(pic);
    }

    protected getInstalledVersion(pic: string): string {
        const path = `${picPathInstalled}/${pic}-version.json`;
        if (!existsSync(path)) {
            return null;
        }
        const manifest = JSON.parse(readFileSync(path, {encoding: 'utf8'}));
        return manifest.version;
    }

    protected getAvailableVersion(pic: string): string {
        const path = `${picPathAvailable}/${pic}-version.json`;
        if (!existsSync(path)) {
            return null;
        }
        const manifest = JSON.parse(readFileSync(path, {encoding: 'utf8'}));
        return manifest.version;
    }

    static flash(pic: string): boolean {
        try {
            const hexPath = join(picPathAvailable, `mopo-${pic}.production.hex`);
            const cmd = `/app/picpgm -p ${hexPath}`;
            logger.info(`Executing ${cmd}`);
            execSync(cmd, {stdio: 'inherit'});
            return true;
        }
        catch(e) {
            // TODO: This is counter intuitive, but success is still throwing, but without status.
            if(!e.status) {
                logger.warn('Catching error without status');
                return true;
            }
            
            logger.error(`Pic programming failed with code ${e.status}`);
            switch (e.status) {
            case 1:
                logger.error('verify error occured');
                break;
            case 2:
                logger.error('no programmer interface found');
                break;
            case 3:
                logger.error('no PIC found');
                break;
            case 4:
                logger.error('invalid parameter');
                break;
            case 5:
                logger.error('HEX file has errors');
                break;
            case 6:
                logger.error('problems with loading port I/O driver');
                break;
            case 7:
                logger.error('no HEX file specified');
                break;
            case 255:
            default:
                logger.error('unexpected error occoured');
                break;
            }
            return false;
        }
    }
}
