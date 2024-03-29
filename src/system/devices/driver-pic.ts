import { byte } from "bitwise";
import { Bit, UInt8 } from "bitwise/types";
import { PromisifiedBus } from "i2c-bus";
import { Coil } from "./coil";
import { OutputDevice } from "./output-device";
import { Pic } from "./pic";
import { PlayfieldLamp } from "./playfield-lamp";
import { Sound } from "./sound";
import {modify} from 'bitwise/buffer';
import { logger } from "../logger";
import { DriverType } from "./driver-type";

const PIC_ADDRESS = 0x41;

/**
 * Communication with the driver board.
 * Payload (9 bytes):
 * L=Lamp (0-52)
 * C=Coil (1-9)
 * S=Sound (1-4)
 * [LLLLLLLL][LSLLLLLL][LLLLLLLL][LLLLLLLL][LLLLLLLL][LLLLLLLL][LLLLLCCC][CCCCCCSS][SS000000]
 */
export class DriverPic extends Pic {
    private readonly bufferFormat = '[LLLLLLLL][LSLLLLLL][LLLLLLLL][LLLLLLLL][LLLLLLLL][LLLLLLLL][LLLLLCCC][CCCCCCSS][SS000000]';
    private static instance: DriverPic;
    i2c1: PromisifiedBus;

    public static getInstance(): DriverPic {
        if (!DriverPic.instance) {
            DriverPic.instance = new DriverPic();
        }

        return DriverPic.instance;
    }

    private lamps: Bit[];
    private coils: Bit[];
    private sounds: Bit[];
    private buffer: Buffer;

    private constructor() {
        super(PIC_ADDRESS, 'Coils');
        this.lamps = this._initArray(53);
        this.coils = this._initArray(9);
        this.sounds = this._initArray(4);
        this.buffer = Buffer.alloc(9);
    }

    private _initArray(size): Bit[] {
        const array = [];
        for (let i = 0; i < size; i++) {
            array[i] = 0;
        }
        return array;
    }

    /**
     * Updates the driver PIC with the given device states.
     * @param {Array} newDeviceStates Collection of new states.
     * @return {boolean} True if the update was successfull, false otherwise.
     */
    async update(newDeviceStates: OutputDevice[]): Promise<boolean> {
        if (!newDeviceStates?.length) {
            return false;
        }

        // Update our internal ordered arrays for all outputs.
        newDeviceStates.forEach((device) => {
            if (device instanceof PlayfieldLamp) {
                // Lamps are zero based
                this.lamps[device.number] = device.isOn ? 1 : 0;
            }
            else if (device instanceof Coil) {
                if (device.driverType === DriverType.LAMP) {
                    this.lamps[device.number] = device.isOn ? 1 : 0;
                }
                else if (device.driverType === DriverType.COIL) {
                    this.coils[device.number - 1] = device.isOn ? 1 : 0;
                }
            }
        });
        
        // only 1 sound can play at a time. Find the first sound to play.
        const sound: Sound = newDeviceStates.find((device) => device instanceof Sound) as Sound;
        if (sound && sound.isOn) {
            const soundBits = byte.read(sound.number as UInt8);
            this.sounds[0] = soundBits[7];
            this.sounds[1] = soundBits[6];
            this.sounds[2] = soundBits[5];
            this.sounds[3] = soundBits[4];
            this.lamps[10 - 1] = soundBits[3];
            // eslint-disable-next-line max-len
            logger.debug(`Sound bits: S1=${this.sounds[0]}, S2=${this.sounds[1]}, S4=${this.sounds[2]}, S8=${this.sounds[3]}, S16=${this.lamps[9 - 1]}`);
        }
        else if (sound && !sound.isOn) {
            // trigger the interrupt to play the prev loaded sound. Putting all lines high
            // causes sound board A6 chip U17 to have all inputs high, causing a low output.
            // The low output triggers an interrupt on U15.
            this.sounds = [0, 0, 0, 0];
            this.lamps[10 - 1] = 0;
        }

        // Update our bit state with the values from the arrays.
        modify(
            this.buffer,
            this.lamps.concat(this.coils).concat(this.sounds),
            0
        );

        this.logBuffer(this.bufferFormat, this.buffer);

        // Perform the I2C write.
        try {
            await this.write(this.buffer);
            return true;
        }
        catch (e) {
            logger.error(e);
            return false;
        }
    }

    async setup(): Promise<void> {
        await super.setup();
     
        // setInterval(() => {
        //     this.test();
        // }, 2000);
        // const version = await this.getVersion();
        // logger.debug(`Driver Pic Version: ${version}`);

        // this.i2c1.close();

        // init all low
        logger.debug(`${this.name}: Sending initial state zeros`);
        await this.write(this.buffer);
    }

    updateRequired(): boolean {
        return super.updateRequired('driver');
    }

    getInstalledVersion(): string {
        return super.getInstalledVersion('driver');
    }

    getAvailableVersion(): string {
        return super.getAvailableVersion('driver');
    }
}
