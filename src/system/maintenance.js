const {MessageBroker, EVENTS} = require('./messages');
const STATE_CONSTANTS = require('./common-game-state-constants');

/**
 * mainten.
 * TODO:
 * - track system uptime, play time, avg ball time? broken switches, etc.
 */
class Maintenance {
    constructor() {
        MessageBroker.on(EVENTS.ON_GAME_STATE_TRANSITION, (transitionEvt) => this.onNewGameState(transitionEvt));
        MessageBroker.on(EVENTS.RELEASE_BALL, (evt) => this.onBallRelease(evt));
        MessageBroker.on(EVENTS.ALL_BALLS_PRESENT, () => this.onAllBallsPresent());
    }

    onNewGameState(transitionEvt) {
        if (transitionEvt.to === STATE_CONSTANTS.STATES.PLAY) {
            // start tracking play time
        }
        else if (transitionEvt.transition === STATE_CONSTANTS.TRANSITIONS.END_GAME) {
            // end tracking play time if we're tracking it.
        }
        else if (transitionEvt.transition === STATE_CONSTANTS.TRANSITIONS.END_BALL) {
            // end tracking ball play time.
        }
    }

    onBallRelease(evt) {
        if (evt && evt.whenReady) {
            // todo: start a couter
        }
    }

    onAllBallsPresent() {
        // end the counter
    }

    // if this elapses, then there is likely a stuck ball. Notify operator.
    onWaitForAllBallsReadyElapsed() {
    }
}

module.exports = Maintenance;
