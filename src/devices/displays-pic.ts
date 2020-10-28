// const Pic = require('./pic');

import { SystemName } from "../game";
import { Pic } from "./pic";
import * as i2c from 'i2c-bus';
import { BytesWritten, PromisifiedBus } from "i2c-bus";


// const i2c = require('i2c-bus');
const logger = require('../system/logger');
const font = require('../system/sys-80-80a-font');

const PIC_ADDRESS = 0x13;

const DEBUG = false;

const COMMAND_SET_SYSTEM = 1;
const COMMAND_RENDER = 2;

const SYSTEM_80_80A = 1;
const SYSTEM_80B = 2;

/**
 * Communication with the displays.
 * System 80/80A payload
 * 4 displays, 6 bytes each
 * 1 status display, 4 bytes
 */
export class DisplaysPic extends Pic {
    private static instance;
    setSystemBuffer: Buffer;
    buffer: Buffer;

    public static getInstance(): DisplaysPic {
        if (!DisplaysPic.instance) {
            DisplaysPic.instance = new DisplaysPic();
        }

        return DisplaysPic.instance;
    }

    private constructor(private system: SystemName = SystemName.SYS80) {
        super(PIC_ADDRESS);

        this.setSystemBuffer = Buffer.alloc(2);
        this.setSystemBuffer[0] = COMMAND_SET_SYSTEM;
        if (this.system === SystemName.SYS80 || this.system === SystemName.SYS80B) {
            this.setSystemBuffer[1] = SYSTEM_80_80A;
            this.buffer = Buffer.alloc(1 + 28);
        }
        else {
            this.setSystemBuffer[1] = SYSTEM_80B;
            this.buffer = Buffer.alloc(1 + 40);
        }
        this.buffer[0] = COMMAND_RENDER;
    }

    /**
     * Renders.
     * {
     *  player1: "DDDDDD",
     *  player2: "DDDDDD",
     *  status: "DDDD"
     * }
     * hgfedcba
     * 0 = abcdef = 00111111
     *
     * a = player1 digit D1
     * b = p1 digit D2
     * ...
     * [ffffffff][eeeeeeee][dddddddd][cccccccc][bbbbbbbb][aaaaaaaa]
     * [llllllll][kkkkkkkk][jjjjjjjj][iiiiiiii][hhhhhhhh][gggggggg]
     * @param {any} displayState data
     */
    async update(displayState) {
        if (this.system === SystemName.SYS80 || this.system === SystemName.SYS80A) {
            this.setBuffer(1, displayState.player1);
            this.setBuffer(7, displayState.player2);
            this.setBuffer(13, displayState.player3);
            this.setBuffer(19, displayState.player4);
            this.setBuffer(25, displayState.status);
        }

        this._logBuffer();

        // Perform the I2C write.
        try {
            await this.write(this.buffer);
        }
        catch (e) {
            if (DEBUG) {
                logger.error(e);
            }
        }
    }

    setBuffer(offset, message) {
        for (let i = 0; i < 6; i++) {
            if (typeof message === 'string') {
                const asciiCode = message.charCodeAt(i);
                const fontByte = font[asciiCode];
                if (fontByte === 0 && asciiCode !== 32) {
                    logger.warn(`Ascii char "${asciiCode}" appears undefined as 0.`);
                }
                this.buffer[offset + i] = fontByte;
            }
            else {
                if (typeof message.glyphs[i] === 'string') {
                    const asciiCode = message.glyphs[i].charCodeAt(0);
                    this.buffer[offset + i] = font[asciiCode];
                }
                else {
                    this.buffer[offset + i] = message.glyphs[i];
                }
            }
        }
    }

    _logBuffer() {
        if (DEBUG) {
            let log = '';
            this.buffer.forEach((b) => {
                log += `[${this.dec2bin(b)}]`;
            });
            logger.debug(log);
        }
    }

    dec2bin(dec) {
        return (dec >>> 0).toString(2);
    }

    async setup() {
        await super.setup();
     
        // setInterval(() => {
        //     this.test();
        // }, 2000);
        // const version = await this.getVersion();
        // logger.debug(`Driver Pic Version: ${version}`);

        await this.write(this.setSystemBuffer);

        // this.i2c1.close();

        // init all low
        if (DEBUG) {
            logger.debug('Sending initial state zeros');
        }
        this.write(this.buffer);
    }

    // async getVersion() {
    //     // const VERSION_COMMAND = 0x02;
    //     await this.i2c1.writeByte(PIC_ADDRESS, 0x00, 0x0D);
    //     const major = await this.i2c1.readByte(PIC_ADDRESS, 0x01);
    //     // const minor = await this.i2c1.readByte(PIC_ADDRESS, 0x02);
    //     const minor = 0;
    //     return `${major}.${minor}`;
    // }
}
