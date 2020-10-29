// const Wlan = require('./wlan');
// const {MessageBroker, EVENTS} = require('./messages');
import { PicVersionMessage } from '../devices/pic-version-message';
import { Board } from './board';
import {logger} from './logger';
import { EVENTS, MessageBroker } from './messages';
// const Board = require('./board');
// const SwitchesPic = require('../devices/switches-pic');
// const DriverPic = require('../devices/driver-pic');
// const semver = require('semver');
// const Config = require('./config');

/**
 * Sets up the system and configures the main hardward.
 */
export class Setup {
    board: Board;
    async setup(): Promise<void> {
        logger.debug('Starting setup.');

        this.board = new Board();
        await this.board.start();

        // TODO
        // const wlan = new Wlan();
        // wlan.setHostname();
        // a network connection is required!
        // const ip = wlan.getIp();
        // logger.info(`Ip address is ${ip}`);
        // if (!ip) {
        //     MessageBroker.emit(EVENTS.WAN_DOWN);
        // }

        // setup PICs and check versions. Emit error if flashing needed.
        MessageBroker.on(EVENTS.PIC_VERSION, (version) => this.onPicVersion(version));

        // this.driverPic = new DriverPic();
        // this.driverPic.setup();

        MessageBroker.emit(EVENTS.SETUP_GPIO, 'setup');
        // return false;
    }

    onPicVersion(versionMessage: PicVersionMessage): void {
        MessageBroker.publishRetain(`mopo/pic/${versionMessage.pic}/version`, versionMessage.version);
        // const config = Config.read();
        // const expectedVersion = config.pics[versionMessage.pic].version;
        // if (semver.lt(versionMessage.version, expectedVersion)) {
        // eslint-disable-next-line max-len
        //     logger.warn(`Pic ${versionMessage.pic} is not running the current version ${expectedVersion}. Its running ${versionMessage.version} Please flash ${versionMessage.pic}.`);
        // }
        // else {
        //     logger.info(`Pic ${versionMessage.pic} is running version ${versionMessage.version}`);
        // }
    }
}