const _ = require('./devices/node_modules/lodash');
const Wlan = require('./wlan');
const Security = require('./security');
const {MessageBroker} = require('./messages');
const FrameBasedOperation = require('./frame-based-operation');
const logger = require('./logger');
const Relay = require('./devices/relay');

/**
 * Manages the Test button.
 */
class Test {
    constructor(displays, switches, lamps, coils, sounds) {
        this.displays = displays;
        this.switches = switches;
        this.lamps = lamps;
        this.coils = coils;
        this.sounds = sounds;
        this.active = false;
        this.wan = new Wlan();
        this.ip = {
            address: '',
            network0: '',
            network1: '',
            network2: '',
            host: '',
        };

        MessageBroker.subscribe('mopo/devices/+/+/test', (topic) => this._testDevice(topic));
    }

    start() {
        this.active = true;

        this.ip.address = this.wan.getIp();
        if (this.displays.type === '80/80a') {
            const ipTokens = this.ip.address.split('.');
            this.ip.network0 = _.padStart(ipTokens[0], 3);
            this.ip.network1 = _.padStart(ipTokens[1], 3);
            this.ip.network2 = _.padStart(ipTokens[2], 3);
            this.ip.host = _.padStart(ipTokens[3], 3);
        }
    }

    end() {
        this.active = false;
    }

    update() {
        if (!this.active) {
            return;
        }

        if (this.displays.type === '80/80a') {
            this.displays.setPlayerDisplay(1, 'CONFIG');
            this.displays.setPlayerDisplay(2, 'AT IP');
            this.displays.setPlayerDisplay(3, `${this.ip.network0}${this.ip.network1}`);
            this.displays.setPlayerDisplay(4, `${this.ip.network2}${this.ip.host}`);
            this.displays.status = Security.getPinCode().toString();
        }
    }

    _testDevice(topic) {
        logger.info(`Testing: ${topic}`);
        const type = topic.split('/')[2];
        const id = topic.split('/')[3];
        if (type === 'sounds') {
            this.sounds[id].play();
        }
        if (type === 'lamps') {
            this.lamps[id].toggle();
        }
        else if (type === 'coils') {
            const coil = this.coils[id];
            if (coil instanceof Relay) {
                coil.toggle();
            }
            else {
                coil.on();
                const fbo = FrameBasedOperation.createByDurationMs(coil.duration, () => {
                    coil.off();
                    this.entities.splice(
                        this.entities.indexOf(fbo),
                        1
                    );
                });
                this.entities.push(fbo);
            }
        }
    }
}

module.exports = Test;
