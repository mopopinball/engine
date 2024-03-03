import { buffer, byte } from "bitwise";
import { Bit, UInt8 } from "bitwise/types";
import { logger } from "../logger";
import { EVENTS, MessageBroker } from "../messages";
import { GpioPin } from "./gpio-pin";
import { Pic } from "./pic";

import { DIR_IN, DIR_LOW, EDGE_RISING } from 'rpi-gpio'
import * as pins from '../../pins.json';
import { DipSwitchState } from "../dip-switch-state";
import { GpioRegistrator } from "../gpio-registrator";

const PAYLOAD_SIZE_BYTES = 2;
const LAST_NIBBLE_INDEX = (PAYLOAD_SIZE_BYTES * 2) - 1;
const COMMS_LOGGING = false;

/**
 * The switches PIC. NOT i2c.
 * // 2 control inputs from pi
    // 5 outputs via IC4 to pi
    // 5 jumper inputs from K1
    // 4 switch inputs from S1
    // 8 strobes, 8 returns
    // 1 slam
    // 1 led
    // 1 reset
 */
export class SwitchesPic extends Pic implements GpioRegistrator {
    private static instance: SwitchesPic;
    reading: boolean;
    version: string;
    payload: Buffer;
    nibbleCount: number;
    errorCount: number;
    private _data0: GpioPin;
    private _data1: GpioPin;
    private _data2: GpioPin;
    private _data3: GpioPin;
    private _outReady: GpioPin;
    private _ack: GpioPin;
    private _retry: GpioPin;
    private _reset: GpioPin;
    private _payloadInProgress: boolean;
    private k1_1: number;
    private k1_2: number;
    private k1_3: number;
    private k1_4: number;
    private k1_5: number;
    private s1_1: number;
    private s1_3: number;
    private s1_4: number;
    private s1_5: number;
    private slam: number;
    private ready = false;

    public static getInstance(): SwitchesPic {
        if (!SwitchesPic.instance) {
            SwitchesPic.instance = new SwitchesPic();
        }

        return SwitchesPic.instance;
    }

    private constructor() {
        super(null, 'Switches');
        this.reading = false;
        this.version = '0.0.0';

        this.payload = Buffer.alloc(PAYLOAD_SIZE_BYTES);
        this.nibbleCount = -1;
        this.errorCount = 0;

        // MessageBroker.subscribe('mopo/pic/IC1/update', () => this.programHex());

        // on('change', async (channel) => {
        //     if (!this.ready) {
        //         return;
        //     }
        //     // if (channel === pins.IC1_OUT_RDY) {
        //     //     // if (this.reading) {
        //     //     //     logger.error('already reading');
        //     //     //     return;
        //     //     // }

        //     //     // this.reading = true;
        //     //     // if (!this.picReady) {
        //     //     //     this.picReady = true;
        //     //     //     logger.debug('init ack');
        //     //     //     this.reading = false;
        //     //     //     this._sendAck();
        //     //     // }
        //     //     // else {
        //     //     const sendOk = await this._readData();
        //     //     // this.reading = false;
        //     //     if (sendOk) {
        //     //         this.errorCount = 0;
        //     //         this._sendAck();
        //     //     }
        //     //     else {
        //     //         this._sendAck();
        //     //         // this.errorCount++;
        //     //         // if (this.errorCount > 3) {
        //     //         //     this.reset();
        //     //         // }
        //     //         // else {
        //     //         //     this._sendRetry();
        //     //         // }
        //     //     }
        //     //     // }
        //     // }
        // });

        // MessageBroker.on('S3', (value) => {
        //     if (value) {
        //         // logger.debug('reset ' + value);
        //         // this.nibbleCount = -1;
        //         // this._clearBuffer();
        //         // this._sendRetry();
        //         this.reset();
        //     }
        // });
        logger.debug('Switches PIC setup complete.');
    }

    registerGpioPins(): void {
        logger.log('Registering switch GPIO pins');

        this._data0 = new GpioPin(pins.IC1_Data0, DIR_IN);
        this._data1 = new GpioPin(pins.IC1_Data1, DIR_IN);
        this._data2 = new GpioPin(pins.IC1_Data2, DIR_IN);
        this._data3 = new GpioPin(pins.IC1_Data3, DIR_IN);
        this._outReady = new GpioPin(pins.IC1_OUT_RDY, DIR_IN, EDGE_RISING);
        this._outReady.on(() => this.onIC1_OUT_RDY());
        this._ack = new GpioPin(pins.IC1_ACK, DIR_LOW);
        this._retry = new GpioPin(pins.IC1_Resend, DIR_LOW);
        this._reset = new GpioPin(pins.IC1_Reset, DIR_LOW);
    }

    private async onIC1_OUT_RDY() {
        if (!this.ready) {
            return;
        }

        // if (this.reading) {
        //     logger.error('already reading');
        //     return;
        // }

        // this.reading = true;
        // if (!this.picReady) {
        //     this.picReady = true;
        //     logger.debug('init ack');
        //     this.reading = false;
        //     this._sendAck();
        // }
        // else {
        const sendOk = await this._readData();
        // this.reading = false;
        if (sendOk) {
            this.errorCount = 0;
            this._sendAck();
        }
        else {
            this._sendAck();
            // this.errorCount++;
            // if (this.errorCount > 3) {
            //     this.reset();
            // }
            // else {
            //     this._sendRetry();
            // }
        }
        // }
    }

    async setup(): Promise<void> {
        // TODO: Move that constructor logic in here.
    }

    private _clearBuffer(): void {
        this.payload[0] = 0;
        this.payload[1] = 0;
    }

    async reset(): Promise<void> {
        logger.info('Resetting IC1');
        await this._reset.writeLow(); // reset (active low)
        this.nibbleCount = -1;
        this._clearBuffer();
        this.ready = true;
        await this._reset.writeHigh();
        // this._sendAck();
        logger.info('Resetting IC1 complete');
    }

    /**
     * Reads the entire data payload from the PIC one nibble at a time.
     * There are 3 valid payloads (C = checksum):
     *      Op code 0 - Version info:
     *      [00VVVVVV][VVVVCCCC] V = version info
     *      Op code 1 - Jumper/dip values:
     *      [01KKKKKW][WWWLCCCC] K = switch K1, W = switch S1
     *      Op Code 2 - Switch matrix state
     *      [10SSSRRR][T000CCCC] S=strobe, R=return, T=activated
     */
    private async _readData(): Promise<boolean> {
        this.nibbleCount++;

        // if we're past the end of our payload, start a new payload.
        if (this.nibbleCount > LAST_NIBBLE_INDEX) {
            this.nibbleCount = 0;
            this._clearBuffer();
        }

        // read the incoming nibble and apply it to the full payload.
        const nibble = await this._readNibble();
        buffer.modify(this.payload, nibble, this.nibbleCount * 4);

        if (COMMS_LOGGING) {
            // eslint-disable-next-line max-len
            logger.debug(`Nibble ${this.nibbleCount} = ${nibble}.`);
            this.logBuffer('', this.payload);
        }

        if (this.nibbleCount === LAST_NIBBLE_INDEX) {
            this._payloadInProgress = false;

            const opCode = this.payload[0] >>> 6;
            if (COMMS_LOGGING) {
                if (opCode === 0) {
                    logger.debug('[00VVVVVV][VVVVCCCC]');
                }
                else if (opCode === 1) {
                    logger.debug('[01KKKKKW][WWWLCCCC]');
                }
                else {
                    logger.debug('[10SSSRRR][T000CCCC]');
                }
                const p = [];
                for (let i = 0; i < this.payload.length; i++) {
                    p.push(this.dec2bin(this.payload[i], 8));
                }
                logger.debug(`[${p.join('][')}]`);
            }

            const crcOk = this.isParityOk();
            if (!crcOk) {
                logger.debug('Bad switch data, CRC failed. Resend.');
                return false;
            }

            switch (opCode) {
            case 0:
                this._onVersionPayload();
                break;
            case 1:
                this._onDipPayload();
                break;
            case 2:
                this._onSwitchMatrixPayload();
                break;
            default:
                logger.error(new Error('Unexpected op code.'));
                return false;
            }
        }

        return true;
    }

    isParityOk(): boolean {
        const nib3 = (this.payload[1] & 0x0F);

        const nib0 = (this.payload[0] & 0xF0) >>> 4;
        const nib0Actual = this.getParity(nib0);
        const nib0Expected = (nib3 & 0x08) >>> 3;

        const nib1 = (this.payload[0] & 0x0F);
        const nib1Actual = this.getParity(nib1);
        const nib1Expected = (nib3 & 0x04) >>> 2;

        const nib2 = (this.payload[1] & 0xF0) >>> 4;
        const nib2Actual = this.getParity(nib2);
        const nib2Expected = (nib3 & 0x02) >>> 1;

        // intentinoally not === so that true is equal to 1.
        return nib0Actual == nib0Expected &&
            nib1Actual == nib1Expected &&
            nib2Actual == nib2Expected;
    }

    _onVersionPayload(): void {
        logger.debug('Got a Version payload');
        const major = this.payload[0] & 0x3F;
        const minor = this.payload[1] >>> 4;
        this.version = `${major}.${minor}.0`;
        this.reportVersion();
    }

    // [01KKKKKW][WWWLCCCC] K = switch K1, W = switch S1
    _onDipPayload(): void {
        logger.debug('Got a DIP payload');
        const byte0 = byte.read(this.payload[0] as UInt8);
        this.k1_1 = byte0[2];
        this.k1_2 = byte0[3];
        this.k1_3 = byte0[4];
        this.k1_4 = byte0[5];
        this.k1_5 = byte0[6];
        this.s1_1 = byte0[7];
        const byte1 = byte.read(this.payload[1] as UInt8);
        this.s1_3 = byte1[0];
        this.s1_4 = byte1[1];
        this.s1_5 = byte1[2];
        this.slam = byte1[3];
        this.reportDips();
    }

    // [10SSSRRR][T000CCCC] S=strobe, R=return, T=activated
    _onSwitchMatrixPayload(): void {
        const strobe = (this.payload[0] & 0x38) >>> 3;
        const ret = this.payload[0] & 0x07;
        const switchState = this.payload[1] >>> 7;
        const switchNum = (strobe * 10) + ret;
        logger.trace(`[Switch Matrix payload]: ${strobe} ${ret} = ${switchNum} in ${switchState}`);
        // the switch matrix is active electrically low, so invert switchState
        this.sendMessage(EVENTS.MATRIX, {
            switch: switchNum,
            activated: !switchState
        });
    }

    sendMessage(topic: EVENTS, payload: unknown): void {
        MessageBroker.getInstance().emit(topic, payload);
    }

    async _readNibble(): Promise<Bit[]> {
        const bools = await Promise.all([
            this._data0.read(),
            this._data1.read(),
            this._data2.read(),
            this._data3.read()
        ]);
        return [
            this.boolToBit(bools[0]), this.boolToBit(bools[1]),
            this.boolToBit(bools[2]), this.boolToBit(bools[3])
        ];
    }

    private boolToBit(bool: boolean): Bit {
        return bool ? 1 : 0;
    }

    private _sendAck() {
        if (COMMS_LOGGING) {
            logger.info('Sending ACK');
        }
        this._ack.toggle();
    }

    private async _sendRetry() {
        if (COMMS_LOGGING) {
            logger.info('Sending retry');
        }
        await this._retry.writeHigh();
        this._retry.writeLow();
    }

    private reportVersion() {
        this.sendMessage(EVENTS.PIC_VERSION, {
            pic: 'IC1',
            version: this.version
        });
    }

    private reportDips(): void {
        const state: DipSwitchState = {
            k1: {
                sw1: !!this.k1_1,
                sw2: !!this.k1_2,
                sw3: !!this.k1_3,
                sw4: !!this.k1_4,
                sw5: !!this.k1_5
            },
            s1: {
                sw1: !!this.s1_1,
                sw2: null,
                sw3: !!this.s1_3,
                sw4: !!this.s1_4,
                sw5: !!this.s1_5,
                sw6: null,
                sw7: null,
                sw8: null
            },
            slam: !!this.slam
        };
        MessageBroker.getInstance().emit(EVENTS.IC1_DIPS, state);

    }

    getParity(n: number): number {
        let parity = 0;
        while (n) {
            parity = parity ? 0 : 1;
            n = n & (n - 1);
        }
        return parity;
    }

    updateRequired(): boolean {
        return super.updateRequired('switches');
    }

    getInstalledVersion(): string {
        return super.getInstalledVersion('switches');
    }

    getAvailableVersion(): string {
        return super.getAvailableVersion('switches');
    }

    // programHex(pathToHex: string): SpawnSyncReturns<string> {
    //     logger.debug('program ic1');
    //     // await gpiop.destroy();
    //     const hexFile = '../../../pics/mopo-switches.production.hex';
    //     MessageBroker.publish('mopo/pic/IC1/update/updating', 'updating');
    //     const result = super.programHex(hexFile);
    //     if (result.status) {
    //         MessageBroker.publish('mopo/pic/IC1/update/fail', 'fail');
    //     }
    //     else {
    //         MessageBroker.publish('mopo/pic/IC1/update/pass', 'pass');
    //     }
    //     logger.info('Resetting GPIO pins');
    //     MessageBroker.emit(EVENTS.SETUP_GPIO);
    // }
}