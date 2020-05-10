const {OUTPUT_DEVICE_TYPES} = require('./output-device');
const bufferOperations = require('bitwise/buffer');
const bitwise = require('bitwise');
const Pic = require('./pic');
const i2c = require('i2c-bus');
const logger = require('../util/logger');
const {DRIVER_TYPES} = require('./coil');

const PIC_ADDRESS = 0x41;

const DEBUG = false;

/**
 * Communication with the driver board.
 * Payload (9 bytes):
 * L=Lamp (0-52)
 * C=Coil (1-9)
 * S=Sound (1-4)
 * [LLLLLLLL][LSLLLLLL][LLLLLLLL][LLLLLLLL][LLLLLLLL][LLLLLLLL][LLLLLCCC][CCCCCCSS][SS000000]
 */
class DriverPic extends Pic {
    constructor() {
        super();
        this.lamps = this._initArray(53);
        this.coils = this._initArray(9);
        this.sounds = this._initArray(4);

        this.buffer = Buffer.alloc(9);

        // listen for lamp changes, coil changes and sounds.
        // MessageBroker.on(EVENTS.OUTPUT_DEVICE_CHANGE, (newStates) => {
        //     this.onDriverItemChange(newStates);
        // });
    }

    _initArray(size) {
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
    async update(newDeviceStates) {
        if (!newDeviceStates || newDeviceStates.length === 0) {
            return false;
        }

        // Update our internal ordered arrays for all outputs.
        newDeviceStates.forEach((device) => {
            if (device.type === OUTPUT_DEVICE_TYPES.LIGHT) {
                // Lamps are zero based
                this.lamps[device.number] = device.isOn;
            }
            else if (device.type === OUTPUT_DEVICE_TYPES.COIL) {
                if (device.driverType === DRIVER_TYPES.LAMP) {
                    this.lamps[device.number] = device.isOn;
                }
                else if (device.driverType === DRIVER_TYPES.COIL) {
                    this.coils[device.number - 1] = device.isOn;
                }
            }
        });

        // only 1 sound can play at a time. Find the first sound to play.
        const sound = newDeviceStates.find((device) => {
            return device.type === OUTPUT_DEVICE_TYPES.SOUND && device.state;
        });

        if (sound && sound.state === 'playing') {
            // logger.debug('state 0');
            this.sounds = [0, 0, 0, 0];
            sound.ack();
        }
        else if (sound && sound.state === 'ack') {
            sound.done(); // ack the sound so it only plays once.
            const soundBits = bitwise.byte.read(sound.number);
            this.sounds[0] = soundBits[7];
            this.sounds[1] = soundBits[6];
            this.sounds[2] = soundBits[5];
            this.sounds[3] = soundBits[4];
            this.lamps[10 - 1] = soundBits[3];
            // eslint-disable-next-line max-len
            // logger.debug(`Sound bits: S1=${this.sounds[0]}, S2=${this.sounds[1]}, S4=${this.sounds[2]}, S8=${this.sounds[3]}, S16=${this.lamps[9 - 1]}`);
        }
        else if (sound && sound.state === 'done') {
            sound.state = null;
            // trigger the interrupt to play the prev loaded sound. Putting all lines high
            // causes sound board A6 chip U17 to have all inputs high, causing a low output.
            // The low output triggers an interrupt on U15.
            // logger.debug('acking sound');
            this.sounds = [0, 0, 0, 0];
            this.lamps[10 - 1] = 0;
        }

        // Update our bit state with the values from the arrays.
        bufferOperations.modify(
            this.buffer,
            this.lamps.concat(this.coils).concat(this.sounds),
            0
        );

        this._logBuffer();

        // Perform the I2C write.
        try {
            await this.write();
            return true;
        }
        catch (e) {
            if (DEBUG) {
                logger.error(e);
            }
            return false;
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
        this.i2c1 = await this.openConnection();
        const addresses = await this.scan();
        logger.debug(`Found i2c devices: ${JSON.stringify(addresses)}`);
        // setInterval(() => {
        //     this.test();
        // }, 2000);
        // const version = await this.getVersion();
        // logger.debug(`Driver Pic Version: ${version}`);

        // this.i2c1.close();

        // init all low
        if (DEBUG) {
            logger.debug('Sending initial state zeros');
        }
        this.write();
    }

    async openConnection() {
        return i2c.openPromisified(1);
    }

    async scan() {
        return this.i2c1.scan();
    }

    // async getVersion() {
    //     // const VERSION_COMMAND = 0x02;
    //     await this.i2c1.writeByte(PIC_ADDRESS, 0x00, 0x0D);
    //     const major = await this.i2c1.readByte(PIC_ADDRESS, 0x01);
    //     // const minor = await this.i2c1.readByte(PIC_ADDRESS, 0x02);
    //     const minor = 0;
    //     return `${major}.${minor}`;
    // }

    async write() {
        if (!this.i2c1) {
            logger.error('I2C not ready to write');
            return;
        }
        return this.i2c1.i2cWrite(PIC_ADDRESS, this.buffer.length, this.buffer);
    }
}

const singleton = new DriverPic();

module.exports = singleton;
