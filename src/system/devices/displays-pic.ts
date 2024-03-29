import { SystemName } from "../game";
import { Sys80or80ADisplay } from "./display-80-80a";
import { logger } from "../logger";
import {font} from "../sys-80-80a-font";
import { Pic } from "./pic";


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
    private readonly bufferFormat = '[ffffffff][eeeeeeee][dddddddd][cccccccc][bbbbbbbb][aaaaaaaa][llllllll][kkkkkkkk][jjjjjjjj][iiiiiiii][hhhhhhhh][gggggggg]';
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
        super(PIC_ADDRESS, 'Displays');

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
    async update(displayState: Sys80or80ADisplay): Promise<void> {
        if (this.system === SystemName.SYS80 || this.system === SystemName.SYS80A) {
            this.setBuffer(1, displayState.player1.currentValue);
            this.setBuffer(7, displayState.player2.currentValue);
            this.setBuffer(13, displayState.player3.currentValue);
            this.setBuffer(19, displayState.player4.currentValue);
            this.setBuffer(25, displayState.status.currentValue);
        }

        this.logBuffer(this.bufferFormat, this.buffer);

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

    setBuffer(offset: number, message: string): void {
        for (let i = 0; i < 6; i++) {
            if (typeof message === 'string') {
                const asciiCode = message.charCodeAt(i);
                const fontByte = font[asciiCode];
                if (fontByte === 0 && asciiCode !== 32) {
                    logger.warn(`Ascii char "${message.charAt(i)}(${asciiCode})" appears undefined as 0.`);
                }
                this.buffer[offset + i] = fontByte;
            }
            // else {
            //     if (typeof message.glyphs[i] === 'string') {
            //         const asciiCode = message.glyphs[i].charCodeAt(0);
            //         this.buffer[offset + i] = font[asciiCode];
            //     }
            //     else {
            //         this.buffer[offset + i] = message.glyphs[i];
            //     }
            // }
        }
    }

    async setup(): Promise<void> {
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
        await this.write(this.buffer);
    }

    updateRequired(): boolean {
        return super.updateRequired('displays');
    }

    getInstalledVersion(): string {
        return super.getInstalledVersion('displays');
    }

    getAvailableVersion(): string {
        return super.getAvailableVersion('displays');
    }
}
