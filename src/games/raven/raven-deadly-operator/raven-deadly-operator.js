const Game = require('../../game');
const config = require('../config.json');
const {MessageBroker, EVENTS} = require('../../../modules/messages');
const logger = require('../../../util/logger');

/**
 * Main class for Raven: Deadly Operator
 */
class RavenDeadlyOperator extends Game {
    constructor() {
        super(config);
        MessageBroker.on(EVENTS.MATRIX, (payload) => {
            logger.info(JSON.stringify(payload));
        });
    }

    attract() {
    }

    // these things are state machines.
}

module.exports = RavenDeadlyOperator;
