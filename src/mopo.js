const Setup = require('../modules/setup');
const logger = require('../util/logger');
const Config = require('../modules/config');
const {MessageBroker, EVENTS} = require('../modules/messages');
const path = require('path');
const Security = require('../modules/security');
const Server = require('../apps/server');
const Maintenance = require('../modules/maintenance');

function onUncaughtError(err) {
    const detail = err.stack ? err.stack : JSON.stringify(err);
    logger.error(`${err.message} ${detail}`);
}

process.on('uncaughtException', (err) => onUncaughtError(err));
process.on('unhandledRejection', (reason) => onUncaughtError(reason));

logger.info('STARTING MOPO PINBALL');

const mopo = new Mopo();
mopo.start();

/**
 * Main class.
 */
class Mopo {
    constructor() {
        this.maintenance = new Maintenance();
        // todo: wait for other kinds of setup (eg. spi)
        // MessageBroker.on(EVENTS.SETUP_GPIO_COMPLETE, () => this.onLoadGame());
        // load the game when we know the switches pic is ready (by it updating its dip values.)
        MessageBroker.on(EVENTS.IC1_DIPS, () => this.onLoadGame());
    }

    async start() {
        const setup = new Setup();
        await setup.setup();
    }

    async onLoadGame() {
        logger.debug('Starting game...');
        // TODO: Listen for game changes to live swap active game.
        const config = Config.read();
        const gamePath = path.normalize(`${__dirname}/../${config.gamePath}`);
        if (gamePath) {
            const Game = require(gamePath);
            this.game = new Game();
            logger.info(`Loaded game "${this.game.name}".`);
            // once we know the system version, we can setup an appropriate security pin.
            this.security = new Security(this.game.system);
            this.game.setup();
            this.game.startAttract();

            this.server = new Server();
            this.server.start();
        }
        else {
            logger.warn('No game configured.');
        }
    }
}

module.exports = Mopo;
