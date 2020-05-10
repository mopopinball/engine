const StateComponent = require('../../engine/state-component');

/**
 * todo
 */
class MidballSelect extends StateComponent {
    constructor(lamps, displays, centerDropTargets, rightDropTargets) {
        super('midball');
        this.lamps = lamps;
        this.displays = displays;
        this.centerDropTargets = centerDropTargets;
        this.rightDropTargets = rightDropTargets;
    }
    enter() {
        super.enter();

        this.deviceQueue.push([
            // () => this.leftWarbase.ejectBallIfPresent(),
            // () => this.rightWarbase.ejectBallIfPresent(),
            () => this.centerDropTargets.reset(),
            () => this.rightDropTargets.reset()
        ]);
        this.lamps.LAUNCH_RIGHT_SHOOTER.blink(250);
        this.lamps.RIGHT_ACTIVATE_WARBASE.blink(250);
        this.lamps.LEFT_ACTIVATE_WARBASE.blink(250);
        this.displays.setPlayerDisplay(2, 'Shoot');
        this.displays.setPlayerDisplay(3, 'A Free');
        this.displays.setPlayerDisplay(4, 'Hole');
    }

    leave() {
        super.leave();
        this.lamps.LAUNCH_RIGHT_SHOOTER.blinkStop();
        this.lamps.RIGHT_ACTIVATE_WARBASE.blinkStop();
        this.lamps.LEFT_ACTIVATE_WARBASE.blinkStop();
        this.displays.setPlayerDisplay(2, '');
        this.displays.setPlayerDisplay(3, '');
        this.displays.setPlayerDisplay(4, '');
    }
}

module.exports = MidballSelect;
