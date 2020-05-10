const {MessageBroker, EVENTS} = require('../../../modules/messages');
const logger = require('../../../util/logger');
const StateComponent = require('../../engine/state-component');

/**
 * Manages mode selection.
 */
class ModeSelector extends StateComponent {
    constructor(modes, displays, rightFlipperSwitch, sounds) {
        super('mode');
        this.gameModes = modes;
        this.displays = displays;
        this.rightFlipperSwitch = rightFlipperSwitch;
        this.sounds = sounds;
        this.lastCountDownValue = null;
        this.countDownInterval = 5000;
        MessageBroker.on('modeSelector_operation', (newState) => this.onOperationChange(newState));
        this.onEvent(MessageBroker, EVENTS.FORCE_SELECT_MODE, () => this.onForceSelectMode());

        // right flipper changes order until first switch is hit.
        this.onEvent(this.rightFlipperSwitch, 'change', (activated) => this.onRightFlipper(activated));
    }

    // entity method
    onSwitchChange(sw, activated) {
        if (this.active && activated && sw.qualifiesPlayfield) {
            // request to start that mode
            MessageBroker.emit(EVENTS.GAME_STATE_TRANSITION, this.selectedMode.transition);
        }
    }

    onOperationChange(newState) {
        this.operation = newState;
    }

    onCountdownElapsed() {
        this.sounds.ATTACK_ATTACK.play();

        this.onForceSelectMode();
    }

    onForceSelectMode() {
        if (this.active) {
            // request to start that mode
            MessageBroker.emit(EVENTS.GAME_STATE_TRANSITION, this.selectedMode.transition);
        }
    }

    enter() {
        super.enter();

        this.unselectAll();
        this.displays.player1 = 'SELECT';
        this.displays.player2 = 'ORDERS';
        this.displays.player3 = '      ';
        this.displays.player4 = '      ';

        this.selectedMode = this.gameModes[0];
        this.onModeChange();

        logger.info(this.operation);
        if (this.operation === 'timed') {
            this.countDownStart = new Date();
            this.countdownTimer = setTimeout(() => this.onCountdownElapsed(), this.countDownInterval);
        }
        else {
            this.lastCountDownValue = null;
        }
    }

    leave() {
        super.leave();
        clearTimeout(this.countdownTimer);
        this.displays.setCredits('');
    }

    update() {
        if (!this.active) {
            return;
        }

        if (this.operation === 'timed') {
            const countDownValue = this._getFormattedCountdownValue();
            if (countDownValue > 0 && countDownValue !== this.lastCountDownValue) {
                this.sounds.HIT_2.play();
                this.lastCountDownValue = countDownValue;

                this.displays.player1 = 'SELECT';
                this.displays.player2 = `PLAN ${countDownValue}`;
            }
        }
        else {
            this.displays.player1 = 'SELECT';
            this.displays.player2 = 'PLAN  ';
        }

        const nameTokens = this.selectedMode.name.split(' ');
        this.displays.setPlayerDisplay(3, nameTokens[0]);
        this.displays.setPlayerDisplay(4, nameTokens[1]);
        this.displays.setCredits('L' + this.selectedMode.getLevel());
    }

    unselectAll() {
        this.selectedMode = null;
        this.onModeChange();
    }

    resetAll() {
        this.gameModes.forEach((mode) => {
            mode.reset();
        });
    }

    onRightFlipper(activated) {
        if (activated && this.active) {
            let currentModeIndex = this.gameModes.indexOf(this.selectedMode);
            currentModeIndex = (currentModeIndex + 1) % this.gameModes.length;
            this.selectedMode = this.gameModes[currentModeIndex];
            this.onModeChange();
            if (this.operation !== 'timed') {
                this.sounds.HIT_2.play();
            }
        }
    }

    onModeChange() {
        this.gameModes.forEach((mode) => {
            mode.showObjective(mode === this.selectedMode);
        });
    }

    _getFormattedCountdownValue() {
        if (!this.countDownStart) {
            return '';
        }

        const now = new Date();
        const diff = now - this.countDownStart;
        return (this.countDownInterval / 1000) - Math.floor(diff / 1000);
    }
}

module.exports = ModeSelector;
