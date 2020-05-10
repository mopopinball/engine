const Wlan = require('./wlan');
const {MessageBroker, EVENTS} = require('./messages');
const logger = require('../util/logger');
const Board = require('../modules/board');
const SwitchesPic = require('../devices/switches-pic');
// const DriverPic = require('../devices/driver-pic');
const semver = require('semver');
const Config = require('./config');

/**
 * Sets up the system and configures the main hardward.
 */
class Setup {
    async setup() {
        logger.debug('Starting setup.');

        this.board = new Board();
        await this.board.start();

        const wlan = new Wlan();
        wlan.setHostname();
        // a network connection is required!
        const ip = wlan.getIp();
        logger.info(`Ip address is ${ip}`);
        if (!ip) {
            MessageBroker.emit(EVENTS.WAN_DOWN);
        }

        // setup PICs and check versions. Emit error if flashing needed.
        MessageBroker.on(EVENTS.PIC_VERSION, (version) => this.onPicVersion(version));

        // this.driverPic = new DriverPic();
        // this.driverPic.setup();

        this.switchesPic = new SwitchesPic();
        MessageBroker.emit(EVENTS.SETUP_GPIO, 'setup');
        // return false;
    }

    onPicVersion(versionMessage) {
        MessageBroker.publishRetain(`mopo/pic/${versionMessage.pic}/version`, versionMessage.version);
        const config = Config.read();
        const expectedVersion = config.pics[versionMessage.pic].version;
        if (semver.lt(versionMessage.version, expectedVersion)) {
            // eslint-disable-next-line max-len
            logger.warn(`Pic ${versionMessage.pic} is not running the current version ${expectedVersion}. Its running ${versionMessage.version} Please flash ${versionMessage.pic}.`);
        }
        else {
            logger.info(`Pic ${versionMessage.pic} is running version ${versionMessage.version}`);
        }
    }
}

module.exports = Setup;
