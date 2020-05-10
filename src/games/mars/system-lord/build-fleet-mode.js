const {MessageBroker, EVENTS} = require('../../../modules/messages');
const Utils = require('../../../modules/utils');
const FrameBasedOperation = require('../../engine/frame-based-operation');
const StateComponent = require('../../engine/state-component');
// const logger = require('../../../util/logger');

/**
 * The build fleet mode.
 */
class BuildFleetMode extends StateComponent {
    constructor(
        displays, scoreComponent, centerTargets, rightTargets,
        completeLamp, completeSwitch, sounds
    ) {
        super('build');
        this.displays = displays;
        this.scoreComponent = scoreComponent;
        this.name = 'Build Fleet';
        this.level = 1;
        this.transition = 'selectBuild';
        this.shipCount = 0;
        this.shipsEarnedThisLevel = 0;
        this.centerDropTargets = centerTargets;
        this.rightDropTargets = rightTargets;
        this.completeLamp = completeLamp;
        this.completeSwitch = completeSwitch;
        this.sounds = sounds;
        this.id = 'build';
        this.initialLevelSeconds = 45;
        this.secondsRemaining = this.initialLevelSeconds;

        this.onEvent(this.centerDropTargets, 'targetDown', () => this.onTargetDown());
        this.onEvent(this.rightDropTargets, 'targetDown', () => this.onTargetDown());
        this.onEvent(this.completeSwitch, 'active', () => this.onCompleteModeHit());

        // this.completeBlinker = FrameBasedOperation.createByDurationMs(10 * 1000, () => {
        //     this.completeLamp.toggle();
        // });
    }

    update() {
        if (!this.active) {
            return;
        }

        // if (this.completeBlinker) {
            // go from 10s to 500ms
            // const blinkInterval = Math.max(500, 10000 * this.secondsRemaining / this.initialLevelSeconds);
            // logger.debug(`Blink: ${blinkInterval}`);
            // this.completeBlinker.updateDurationMs(blinkInterval);
            // this.completeBlinker.update();
        // }

        this.displays.setPlayerDisplay(1, this.scoreComponent.getScore());
        this.displays.setPlayerDisplay(2, this.secondsRemaining.toString());
        this.displays.setPlayerDisplay(3, 'Ships');
        this.displays.setPlayerDisplay(4, this.shipCount + this.shipsEarnedThisLevel);
    }

    showObjective(show) {
        if (show) {
            const nameTokens = this.name.split(' ');
            this.displays.setPlayerDisplay(3, nameTokens[0]);
            this.displays.setPlayerDisplay(4, nameTokens[1]);
            this.centerDropTargets.lampsOn();
            this.rightDropTargets.lampsOn();
        }
        else {
            this.centerDropTargets.lampsOff();
            this.rightDropTargets.lampsOff();
        }
    }

    enter() {
        super.enter();
        this.secondsRemaining = this.initialLevelSeconds;
        this.shipsEarnedThisLevel = 0;
        this.countdownInterval = setInterval(() => this.onCountdown(), 1000);
        this.completeLamp.blink(500);
    }

    async leave() {
        super.leave();

        clearInterval(this.countdownInterval);
        // if percent retained not set, the mode must have ended with a drain.
        if (!this.percentRetained) {
            this.percentRetained = this._calculatePercentRetained();
        }
        this.shipCount += Math.floor(this.shipsEarnedThisLevel * this.percentRetained);
        this.shipsEarnedThisLevel = 0;
        this.level++;
        this.percentRetained = null;

        this.secondsRemaining = this.initialLevelSeconds;
        await this.centerDropTargets.reset();
        await this.rightDropTargets.reset();
        this.completeLamp.blinkStop();
    }

    reset() {
        super.reset();
        clearInterval(this.countdownInterval);
        this.secondsRemaining = this.initialLevelSeconds;
        this.shipsEarnedThisLevel = 0;
        this.shipCount = 0;
        this.level = 1;
    }

    onCountdown() {
        this.secondsRemaining--;
        if (this.secondsRemaining <= 10 && this.secondsRemaining > 0) {
            this.sounds.HIT_2.play();
        }
        else if (this.secondsRemaining <= 0) {
            const percentRetained = this._calculatePercentRetained();
            this.onCompleteMode(percentRetained);
        }
    }

    _calculatePercentRetained() {
        const lower = 50 - ((this.level - 1) * 10);
        const max = 100 - ((this.level - 1) * 10);
        return Utils.getRandomPercentage(lower, max);
    }

    onTargetDown() {
        if (!this.active) {
            return;
        }

        this.sounds.HIT_2.play();

        this.shipsEarnedThisLevel++;
        this.scoreComponent.addScore(1000);

        if (this.centerDropTargets.isAllTargetsDown()) {
            this._delayAndResetTargetBank(this.centerDropTargets);
        }
        if (this.rightDropTargets.isAllTargetsDown()) {
            this._delayAndResetTargetBank(this.rightDropTargets);
        }
    }

    _delayAndResetTargetBank(targetBank) {
        setTimeout(() => targetBank.reset(), 500);
    }

    onCompleteModeHit() {
        this.sounds.ATTACK_ATTACK.play();
        this.onCompleteMode(1);
    }

    onCompleteMode(percentShipsRetained) {
        this.percentRetained = percentShipsRetained;
        MessageBroker.emit(EVENTS.GAME_STATE_TRANSITION, 'startMidballSelect');
    }

    getLevel() {
        return this.level;
    }
}

module.exports = BuildFleetMode;
