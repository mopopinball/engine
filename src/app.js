const logger = require('./util/logger');
const Mopo = require('./apps/mopo');

function onUncaughtError(err) {
    const detail = err.stack ? err.stack : JSON.stringify(err);
    logger.error(`${err.message} ${detail}`);
}

process.on('uncaughtException', (err) => onUncaughtError(err));
process.on('unhandledRejection', (reason) => onUncaughtError(reason));

logger.info('STARTING MOPO PINBALL');

const mopo = new Mopo();
mopo.start();
