const Game = require('../../game');
const config = require('../config.json');
const Utils = require('../../../modules/utils');
const {MessageBroker, EVENTS} = require('../../../modules/messages');
const logger = require('../../../util/logger');
const Warbase = require('./warbase');
const LampCollection = require('./lamp-collection');
const ScoreComponent = require('./score-component');
const DeviceQueue = require('../../engine/device-queue');
const TargetBank = require('./target-bank');
const Displays = require('../../engine/display-80-80a');
const AttackBasesMode = require('./attack-bases-mode');
const BuildFleetMode = require('./build-fleet-mode');
const MidballSelect = require('./midball-select');
const ModeSelector = require('./mode-selector');
const BallManager = require('../../engine/ball-manager');
const Delay = require('../../engine/delay');
const AttractContrib = require('./attract-contrib');

/**
 * Main class for Mars: System Lord.
 * BUGS
 * starting midball select after ending multiball immediatly select mode
 * starting AB incurs free base hit
 * AB mode multiball not ending
 + drop targets not resetting at end of ball
 * score not incremeting during midball select
 + game over did not reset fleet level
 * multiball scoring not ending on bases
 * enter attract shows nothing on status display
 * turn off "active warbase" on locked bases
 * outhole !activated event missed, kept firing outhole.
 * open slam switch causes webserver to restart because we 'got dips again'
 * ball sitting in outhole at start/boot? not detected
 * switch 14 and 24?
 * wait for trough sw, start game
 * when targets reset and end of game, breaks their lights attract.
 * FEATURES
 + in status, show Credits=L1, Ball in play=ball num
 * during multiball flash lanes and disable "active warbase"
 * mode select should start on random mode
 * blink the mode level in status display
 * in attack bases mode, LB should be LB1, LB2, etc. to show level
 * add "loading" message on displays until first message
 * webserver only accepts connections when in test mode?
 */
class MarsSystemLord extends Game {
    constructor() {
        const stateMachineConfig = {
            transitions: [
                {name: 'selectMode', from: '*', to: 'mode'},
                {name: 'selectAttack', from: 'mode', to: 'attack'},
                {name: 'selectBuild', from: 'mode', to: 'build'},
                {name: 'startMidballSelect', from: '*', to: 'midball'}
            ]
        };
        super(config, new Displays(), stateMachineConfig);
        this.system = '80';
        this.scoreComponent = new ScoreComponent();
        this.ballManager = new BallManager(
            this.displays, 3,
            this.switches.OUTHOLE, this.coils.OUTHOLE,
            this.switches.TROUGH, this.coils.TROUGH_RELEASE
        );
        this.entities.push(this.ballManager);

        this.bonusLamps = new LampCollection([
            this.lamps.ONE_THOUSAND_BONUS,
            this.lamps.TWO_THOUSAND_BONUS,
            this.lamps.THREE_THOUSAND_BONUS,
            this.lamps.FOUR_THOUSAND_BONUS,
            this.lamps.FIVE_THOUSAND_BONUS,
            this.lamps.SIX_THOUSAND_BONUS,
            this.lamps.SEVEN_THOUSAND_BONUS,
            this.lamps.EIGHT_THOUSAND_BONUS,
            this.lamps.NINE_THOUSAND_BONUS,
            this.lamps.TEN_THOUSAND_BONUS,
            this.lamps.TWENTY_THOUSAND_BONUS
        ]);
        this.entities.push(this.bonusLamps);

        this.multipliers = new LampCollection([
            this.lamps.TWO_TIMES_MULTIPLIERS,
            this.lamps.THREE_TIMES_MULTIPLIERS,
            this.lamps.FOUR_TIMES_MULTIPLIERS,
            this.lamps.FIVE_TIMES_MULTIPLIERS
        ]);
        this.entities.push(this.multipliers);

        // right warbase
        this.rightWarbase = new Warbase(
            this.switches.RIGHT_WARBASE_HOLE,
            this.lamps.RIGHT_ACTIVATE_WARBASE,
            this.lamps.LEFT_AND_RIGHT_SPECIAL,
            this.lamps.LEFT_AND_RIGHT_EXTRABALL,
            this.multipliers,
            this.coils.RIGHT_WARBASE_EJECT,
            this.sounds,
            this.scoreComponent,
            this.sounds.WARBASE_RIGHT_SECURED,
            this.sounds.WARBASE_RIGHT_DEFENCES_DESTROYED
        );
        this.entities.push(this.rightWarbase);

        // left warbase
        this.leftWarbase = new Warbase(
            this.switches.LEFT_WARBASE_HOLE,
            this.lamps.LEFT_ACTIVATE_WARBASE,
            this.lamps.LEFT_AND_RIGHT_SPECIAL,
            this.lamps.LEFT_AND_RIGHT_EXTRABALL,
            this.multipliers,
            this.coils.LEFT_WARBASE_EJECT,
            this.sounds,
            this.scoreComponent,
            this.sounds.WARBASE_LEFT_SECURED,
            this.sounds.WARBASE_LEFT_DEFENCES_DESTROYED
        );
        this.entities.push(this.leftWarbase);

        this.deviceQueue = new DeviceQueue();
        this.entities.push(this.deviceQueue);

        this.centerDropTargets = new TargetBank(
            this.coils.CENTER_TARGET_RESET,
            new LampCollection([
                this.lamps.NUM1_CENTER_DROPTARGET,
                this.lamps.NUM2_CENTER_DROPTARGET,
                this.lamps.NUM3_CENTER_DROPTARGET,
                this.lamps.NUM4_CENTER_DROPTARGET
            ]),
            [
                this.switches.NUM1_CENTER_DROP_TARGET,
                this.switches.NUM2_CENTER_DROP_TARGET,
                this.switches.NUM3_CENTER_DROP_TARGET,
                this.switches.NUM4_CENTER_DROP_TARGET
            ]
        );
        this.entities.push(this.centerDropTargets);

        this.rightDropTargets = new TargetBank(
            this.coils.RIGHT_TARGET_RESET,
            new LampCollection([
                this.lamps.NUM1_RIGHT_DROPTARGET_AND_NUM1_SPINTARGET,
                this.lamps.NUM2_RIGHT_DROPTARGET_AND_NUM2_SPINTARGET,
                this.lamps.NUM3_RIGHT_DROPTARGET_AND_NUM3_SPINTARGET,
                this.lamps.NUM4_RIGHT_DROPTARGET_AND_NUM4_SPINTARGET
            ]),
            [
                this.switches.NUM1_RIGHT_DROP_TARGET,
                this.switches.NUM2_RIGHT_DROP_TARGET,
                this.switches.NUM3_RIGHT_DROP_TARGET,
                this.switches.NUM4_RIGHT_DROP_TARGET
            ]
        );
        this.entities.push(this.rightDropTargets);

        this.attackBasesMode = new AttackBasesMode(
            this.displays, this.scoreComponent, this.leftWarbase, this.rightWarbase, this.sounds
        );
        this.registerStateHandler(this.attackBasesMode);
        this.entities.push(this.attackBasesMode);
        this.buildFleetMode = new BuildFleetMode(
            this.displays, this.scoreComponent, this.centerDropTargets, this.rightDropTargets,
            this.lamps.RIGHT_EXTRABALL_TARGET, this.switches.RIGHT_EXTRABALL_TARGET,
            this.sounds
        );
        this.registerStateHandler(this.buildFleetMode);
        this.entities.push(this.buildFleetMode);
        this.gameModes = [
            this.attackBasesMode,
            this.buildFleetMode
            // research weapons (bumpers. increase/decrease )
        ];
        this.modeSelector = new ModeSelector(this.gameModes, this.displays, this.switches.RIGHT_FLIPPER, this.sounds);
        this.entities.push(this.modeSelector);
        this.registerStateHandler(this.modeSelector);

        this.attractContrib = new AttractContrib(this.displays);

        MessageBroker.on(EVENTS.MULTIBALL_ACTIVE, (evt) => this.onMultiballChange(evt));
        this.midballSelect = new MidballSelect(
            this.lamps, this.displays, this.centerDropTargets, this.rightDropTargets
        );
        this.registerStateHandler(this.midballSelect);
    }

    update() {
        super.update();

        if (this.state != 'mode' && !this.attackBasesMode.active && this.switches.RIGHT_WARBASE_HOLE.active) {
            this.rightWarbase.ejectBallIfPresent();
        }
        else if (this.state != 'mode' && !this.attackBasesMode.active && this.switches.LEFT_WARBASE_HOLE.active) {
            this.leftWarbase.ejectBallIfPresent();
        }
    }

    onSwitchChange(sw, activated) {
        super.onSwitchChange(sw, activated);

        if (!activated) {
            return;
        }

        if (this.isGameInProgress && sw === this.switches.TEN_POINT_SWITCHES) {
            this.scoreComponent.addScore(10);
            this.sounds.HIT_1.play();
        }
        else if (this.isGameInProgress && this.state === 'midball' &&
            Utils.isOneOf(sw, [
                this.switches.RIGHT_WARBASE_HOLE,
                this.switches.LEFT_WARBASE_HOLE,
                this.switches.RIGHT_LAUNCH_LANE
            ])
        ) {
            this.modeSelector.operation = 'timed';
            this.selectMode();
        }
    }

    onAttract() {
        super.onAttract([this.attractContrib]);

        this.modeSelector.unselectAll();

        Delay.delay(3000)
            .then(() => this.ejectHoles())
            .then(() => {
                this.centerDropTargets.chase(250);
                this.rightDropTargets.chase(250);
            });

        this.multipliers.chase(250);
        this.bonusLamps.chase(250);
        this.centerDropTargets.chase(250);
        this.rightDropTargets.chase(250);
        this.lamps.RIGHT_ACTIVATE_WARBASE.blink(500);
        this.lamps.LEFT_ACTIVATE_WARBASE.blink(500);
        this.lamps.RIGHT_EXTRABALL_TARGET.blink(500);
        this.lamps.LEFT_AND_RIGHT_SPECIAL.blink(250);
        this.lamps.LEFT_AND_RIGHT_EXTRABALL.blink(250);
    }

    onLeaveAttract() {
        super.onLeaveAttract();
        this.multipliers.stop();
        this.bonusLamps.stop();
        this.centerDropTargets.lampsOff();
        this.rightDropTargets.lampsOff();
        this.lamps.RIGHT_ACTIVATE_WARBASE.blinkStop();
        this.lamps.LEFT_ACTIVATE_WARBASE.blinkStop();
        this.lamps.RIGHT_EXTRABALL_TARGET.blinkStop();
        this.lamps.LEFT_AND_RIGHT_SPECIAL.blinkStop();
        this.lamps.LEFT_AND_RIGHT_EXTRABALL.blinkStop();
    }

    onPlay() {
        super.onPlay();
        Utils.getRandom([
            this.sounds.PREPARE_FOR_BATTLE,
            this.sounds.EARTHLING,
            this.sounds.FORCES_CHALLENGE_YOU,
            this.sounds.CAN_YOU_SURVIVE
        ]).play();
        this.ejectHoles()
            .then(() => super.releaseBallWhenReady());

        MessageBroker.emit('modeSelector_operation', 'normal');
        this.queuedStateTransitions.push('selectMode');
    }

    // onMode() {
    //     this.modeSelector.activate();
    // }

    onLeaveMode() {
        // this.modeSelector.deactivate();
        this.displays.setStatus('', this.ballManager.currentBall);
    }

    onSelectAttack() {
        this.attackBasesMode.updateDamage(this.buildFleetMode.shipCount);
        logger.debug(`Attack damage set to ${this.attackBasesMode.damageValue}`);
    }

    async onEndBall() {
        super.onEndBall();
        this.sounds.FALLING.play();

        // on ball drain, mode selector in normal operation
        this.modeSelector.onOperationChange('normal');
        this.modeSelector.unselectAll();

        await this.centerDropTargets.reset();
        await this.rightDropTargets.reset();

        // TODO: Things like process bonus etc.
        this.queuedStateTransitions.push('selectMode');
        MessageBroker.emit(EVENTS.RELEASE_BALL, {});
    }

    async onEndGame() {
        super.onEndGame();

        this.modeSelector.resetAll();

        await this.centerDropTargets.reset();
        await this.rightDropTargets.reset();

        const randomEndGameSound = Utils.getRandom([
            this.sounds.BATTLE_OVER,
            this.sounds.EARTHLING
        ]);
        randomEndGameSound.play();
    }

    async ejectHoles() {
        logger.debug('Ejecting holes');
        await this.leftWarbase.ejectBallIfPresent();
        await this.rightWarbase.ejectBallIfPresent();
        await this.centerDropTargets.reset();
        await this.rightDropTargets.reset();
    }

    onMultiballChange(evt) {
        // if we're exiting multiball
        if (evt.previousValue && !evt.newValue) {
            // transition name name
            this.startMidballSelect();
        }
    }

    onMidball() {
        this.modeSelector.unselectAll();
    }
}

module.exports = MarsSystemLord;
