import { byte, nibble } from "bitwise";
import { Bit, Nibble, UInt4, UInt8 } from "bitwise/types";
import { logger } from "../system/logger";
import { EVENTS, MessageBroker } from "../system/messages";
import { GpioPin } from "./gpio-pin";
import { Pic } from "./pic";

// const Pic = require('./pic');
// const gpiop = require('rpi-gpio').promise;
import {promise, DIR_IN, DIR_LOW, EDGE_RISING, on} from 'rpi-gpio'
import * as pins from '../../pins.json';
// const gpio = require('rpi-gpio');
// const pins = require('../../pins.json');
// const Buffer = require('buffer').Buffer;
// const {MessageBroker, EVENTS} = require('../system/messages');
// const logger = require('../system/logger');
// const GpioPin = require('./gpio-pin');
// const bitwise = require('bitwise');
// import { byte, nibble } from 'bitwise';
// import { UInt4, UInt8 } from "bitwise/types";

const PAYLOAD_SIZE = 2;
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
export class SwitchesPic extends Pic {
    private static instance: SwitchesPic;
    reading: boolean;
    version: string;
    payload: Buffer;
    nibbleCount: number;
    errorCount: number;
    _data0: GpioPin;
    _data1: GpioPin;
    _data2: GpioPin;
    _data3: GpioPin;
    _outReady: GpioPin;
    _ack: GpioPin;
    _retry: GpioPin;
    _reset: GpioPin;
    _payloadInProgress: boolean;
    k1_1: number;
    k1_2: number;
    k1_3: number;
    k1_4: number;
    k1_5: number;
    s1_1: number;
    s1_3: number;
    s1_4: number;
    s1_5: number;
    slam: number;
    
    public static getInstance(): SwitchesPic {
        if (!SwitchesPic.instance) {
            SwitchesPic.instance = new SwitchesPic();
        }

        return SwitchesPic.instance;
    }

    private constructor() {
        super(null);
        this.reading = false;
        this.version = '0.0.0';

        this.payload = Buffer.alloc(PAYLOAD_SIZE);
        this.nibbleCount = -1;
        this.errorCount = 0;

        this._data0 = new GpioPin(pins.IC1_Data0, DIR_IN);
        this._data1 = new GpioPin(pins.IC1_Data1, DIR_IN);
        this._data2 = new GpioPin(pins.IC1_Data2, DIR_IN);
        this._data3 = new GpioPin(pins.IC1_Data3, DIR_IN);
        this._outReady = new GpioPin(pins.IC1_OUT_RDY, DIR_IN, EDGE_RISING);
        this._ack = new GpioPin(pins.IC1_ACK, DIR_LOW);
        this._retry = new GpioPin(pins.IC1_Resend, DIR_LOW);
        this._reset = new GpioPin(pins.IC1_Reset, DIR_LOW);

        // MessageBroker.subscribe('mopo/pic/IC1/update', () => this.programHex());

        on('change', async (channel) => {
            if (channel === pins.IC1_OUT_RDY) {
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
        });

        MessageBroker.on(EVENTS.SETUP_GPIO_COMPLETE, () => this.reset());

        // MessageBroker.on('S3', (value) => {
        //     if (value) {
        //         // logger.debug('reset ' + value);
        //         // this.nibbleCount = -1;
        //         // this._clearBuffer();
        //         // this._sendRetry();
        //         this.reset();
        //     }
        // });
    }

    async setup(): Promise<void> {
        // TODO: Move that constructor logic in here.
    }

    _clearBuffer() {
        this.payload[0] = 0;
        this.payload[1] = 0;
    }

    async reset() {
        logger.info('Resetting IC1');
        await this._reset.writeLow(); // reset (active low)
        this.nibbleCount = -1;
        this._clearBuffer();
        // this.picReady = false;
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
    async _readData() {
        this.nibbleCount++;

        if (this.nibbleCount > 3) {
            this.nibbleCount = 0;
            this._clearBuffer();
        }

        // a complete data payload consists of three bytes.
        const nibble = await this._readNibble();
        const byteIndex = Math.round(this.nibbleCount / 2);
        if (this.nibbleCount === 0 || this.nibbleCount === 2) {
            this.payload[byteIndex] = nibble;
        }
        else {
            this.payload[byteIndex] = (this.payload[byteIndex] << 4) | nibble;
        }

        if (COMMS_LOGGING) {
            // eslint-disable-next-line max-len
            logger.debug(`Nibble ${this.nibbleCount} = ${nibble}. Buffer = ${this.dec2bin(this.payload[0])} ${this.dec2bin(this.payload[1])}`);
        }
        if (this.nibbleCount === (PAYLOAD_SIZE * 2) - 1) {
            this._payloadInProgress = false;

            const crcOk = this.isParityOk();
            if (!crcOk) {
                logger.debug('bad data. resend.');
                return false;
            }

            const opCode = this.payload[0] >>> 6;
            if (COMMS_LOGGING) {
                logger.debug(`GOT PAYLOAD. Op Code is: ${opCode}`);
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

    isParityOk() {
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

    _onVersionPayload() {
        const major = this.payload[0] & 0x3F;
        const minor = this.payload[1] >>> 4;
        this.version = `${major}.${minor}.0`;
        this.reportVersion();
    }

    // [01KKKKKW][WWWLCCCC] K = switch K1, W = switch S1
    _onDipPayload() {
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
    _onSwitchMatrixPayload() {
        const strobe = (this.payload[0] & 0x38) >>> 3;
        const ret = this.payload[0] & 0x07;
        const switchState = this.payload[1] >>> 7;
        const switchNum = (strobe * 10) + ret;
        // logger.debug(`MATRIX: ${strobe} ${ret} = ${switchNum} in ${switchState}`);
        // the switch matrix is active electrically low, so invert switchState
        this.sendMessage(EVENTS.MATRIX, {
            switch: switchNum,
            activated: !switchState
        });
    }

    sendMessage(topic, payload) {
        MessageBroker.emit(topic, payload);
        MessageBroker.publish('mopo/dips', JSON.stringify(payload));
    }

    async _readNibble(): Promise<UInt4> {
        // const bit: Bit = 
        const bits: Nibble = await Promise.all([
            this._data0.read() ? 1 : 0,
            this._data1.read() ? 1 : 0,
            this._data2.read() ? 1 : 0,
            this._data3.read() ? 1 : 0
        ]);
        return nibble.write(bits);
    }

    _sendAck() {
        if (COMMS_LOGGING) {
            logger.info('Sending ACK');
        }
        this._ack.toggle();
    }

    async _sendRetry() {
        if (COMMS_LOGGING) {
            logger.info('Sending retry');
        }
        await this._retry.writeHigh();
        this._retry.writeLow();
    }

    reportVersion() {
        this.sendMessage(EVENTS.PIC_VERSION, {
            pic: 'IC1',
            version: this.version
        });
    }

    reportDips() {
        this.sendMessage(EVENTS.IC1_DIPS, {
            K1: {
                1: this.k1_1,
                2: this.k1_2,
                3: this.k1_3,
                4: this.k1_4,
                5: this.k1_5
            },
            S1: {
                1: this.s1_1,
                3: this.s1_3,
                4: this.s1_4,
                5: this.s1_5
            },
            slam: this.slam
        });
    }

    getParity(n): number {
        let parity = 0;
        while (n) {
            parity = parity ? 0 : 1;
            n = n & (n - 1);
        }
        return parity;
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