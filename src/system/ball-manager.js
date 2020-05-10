const {MessageBroker, EVENTS} = require('./messages');
const logger = require('./logger');

/**
 * Manages the ball including releasing new balls, tracking active balls, ball save,
 * waiting for the ball to arrive a the trough etc.
 * TODO: Ball Save
 */
class BallManager {
    // All games will have an outhole switch and outhole coil. Multiball games
    // will have a trough switch and a trough release coil. We determine if
    // this is a mutiball game by the presense of the trough sw/coil.
    constructor(displays, totalBalls = 3, outholeSwitch, outholeCoil, troughSwitch, troughCoil) {
        this.displays = displays;
        this.totalBalls = totalBalls;
        this.outholeSwitch = outholeSwitch;
        this.outholeCoil = outholeCoil;
        this.isMultiballGame = !!troughSwitch;
        this.troughSwitch = troughSwitch;
        this.troughCoil = troughCoil;

        this.troughSwitchActivityState = {
            active: false,
            activeAt: null,
            minActiveDurationMs: 1000
        };
        this.reset();

        // outholeSwitch.on('change', (activated) => this.onBallDrain(activated));
        MessageBroker.on(EVENTS.RELEASE_BALL, (event) => this.onBallRelease(event));
        MessageBroker.on(EVENTS.BALL_LOCKED, (count) => this.onBallLocked(count));
        MessageBroker.on(EVENTS.MULTIBALL_START, (numLockedBallsReleased) =>
            this.onMultiballStart(numLockedBallsReleased)
        );
    }

    update() {
        if (this.releaseWhenReady && this.isAllBallsPresent()) {
            this.releaseWhenReady = false;
            MessageBroker.emit(EVENTS.ALL_BALLS_PRESENT, true);
            this.onBallRelease();
        }
        if (this.outholeSwitch.getActive()) {
            this.onBallDrain(true);
        }
    }

    reset() {
        this.lockedBallCount = 0;
        this.releaseWhenReady = false;
        this.numBallsInPlay = 0;
        this.currentBall = 0;
        this.isGameInProgress = false;
        this.numExtraBalls = 0;
        this.maxExtraBalls = 3;
    }

    debug() {
        logger.debug(`Ball=${this.currentBall}; Inplay=${this.getAdjustedNumBallsInPlay()}`);
        logger.debug(`${this.lockedBallCount} ${this.numExtraBalls}`);
        logger.debug(`${this.isGameInProgress}`);
    }

    play() {
        this.reset();
        this.currentBall = 1;
        this.isGameInProgress = true;
    }

    onBallDrain(switchActivated) {
        if (!switchActivated) {
            return;
        }

        this.debug();

        // if multiball game, move the ball from outhole to trough
        if (this.isMultiballGame) {
            // move ball to trough
            this.outholeCoil.on();
        }

        if (!this.isGameInProgress || !this.numBallsInPlay) {
            return;
        }

        this.numBallsInPlay--;
        const adjustedNumBallsInPlay = this.getAdjustedNumBallsInPlay();

        if (adjustedNumBallsInPlay <= 0 && !this.numExtraBalls) {
            this.currentBall++;
        }
        else if (adjustedNumBallsInPlay <= 0 && this.numExtraBalls) {
            this.numExtraBalls--;
        }
        else if (adjustedNumBallsInPlay === 1) {
            this._multiBallOver();
        }

        if (adjustedNumBallsInPlay >= 1) {
            return;
        }
        else if (this.isGameOver()) {
            this._endGame();
        }
        else {
            this._endBall();
        }
    }

    getAdjustedNumBallsInPlay() {
        return this.numBallsInPlay - this.lockedBallCount;
    }

    _multiBallOver() {
        logger.debug('Multiball is over');
        MessageBroker.emit(EVENTS.MULTIBALL_ACTIVE, {
            previousValue: true,
            newValue: false
        });
    }

    _endGame() {
        MessageBroker.emit(EVENTS.GAME_STATE_TRANSITION, 'endGame');
    }

    _endBall() {
        MessageBroker.emit(EVENTS.GAME_STATE_TRANSITION, 'endBall');
    }

    onBallRelease(event) {
        if (event && event.whenReady) {
            this.releaseWhenReady = true;
            return;
        }

        logger.debug('RELEASE BALL');

        this.numBallsInPlay++;
        this.displays.setBall(this.currentBall);

        if (this.isMultiballGame) {
            // testing in Mars showed that firing the trough coil at nearly the
            // same time as the outhole coil would cause the newly drained ball
            // to bounce back and return to the outhole. Add delay to prevent.
            this._delayTroughCoil();
        }
        else {
            this.outholeCoil.on();
        }
    }

    _delayTroughCoil() {
        setTimeout(() => {
            this.troughCoil.on();
        }, 1000);
    }

    onBallLocked(count) {
        this.lockedBallCount = count;
    }

    isAllBallsPresent() {
        if (this.isMultiballGame) {
            // In a multiball game as the game moves the balls from the outhole to the
            // trough, the trough switch will very briefly become active as a ball
            // passes over the switch.
            // We want to wait for it to become consistently active.
            const now = new Date();
            if (!this.troughSwitch.active) {
                this.troughSwitchActivityState.activeAt = null;
                this.troughSwitchActivityState.active = false;
                return false;
            }
            else if (!this.troughSwitchActivityState.active) {
                this.troughSwitchActivityState.activeAt = now;
                this.troughSwitchActivityState.active = true;
            }
            else {
                return now - this.troughSwitchActivityState.activeAt >=
                    this.troughSwitchActivityState.minActiveDurationMs;
            }
        }
        else {
            return this.outholeSwitch.active;
        }
    }

    isGameOver() {
        return this.currentBall > this.totalBalls;
    }

    addExtraBall() {
        this.numExtraBalls = Math.min(this.numExtraBalls + 1, this.maxExtraBalls);
    }

    onMultiballStart(numLockedBallsReleased) {
        if (!numLockedBallsReleased) {
            throw new Error('Must be positive value');
        }
        this.lockedBallCount -= numLockedBallsReleased;
    }
}

module.exports = BallManager;
