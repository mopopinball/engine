const {MessageBroker, EVENTS} = require('../../../modules/messages');
const Glyph = require('../../engine/sys-80-80a-glyphs');
const GlyphCollection = require('../../engine/glyph-collection');
const FrameBasedOperation = require('../../engine/frame-based-operation');
const StateComponent = require('../../engine/state-component');

/**
 * The attack bases mode entity.
 */
class AttackBases extends StateComponent {
    constructor(displays, scoreComponent, leftBase, rightBase, sounds) {
        super('attack');
        this.displays = displays;
        this.scoreComponent = scoreComponent;
        this.sounds = sounds;
        this.active = false;
        this.name = 'Attack Bases';
        this.transition = 'selectAttack';
        this.id = 'attack';

        this.damageMultiplier = 1;
        this.damageValue = 50;
        this.healthStep = 100;
        this.startMultiball = false;
        this.lockBallWhenLevelComplete = 2;

        this.hitScore = 100;
        this.destroyScore = 1000;
        this.jackpotValue = 5000;
        this.doulbeJackpotValue = 10000;
        this.jackpotHitCount = 0;
        this.superJackpotHitThreshold = 3;

        this.countDownStart = null;
        this.lastCountDownValue = null;

        this.bases = {
            left: {
                name: 'LB',
                level: 1,
                health: 0,
                entity: leftBase,
                displayState: ''
            },
            right: {
                name: 'RB',
                level: 1,
                health: 0,
                entity: rightBase,
                displayState: ''
            }
        };
        this.reset();

        // Animates new flame values
        this.flameUpdater = FrameBasedOperation.createByDurationMs(500, () => {
            const glyph = new Glyph();
            this.flame0 = glyph.getRandomFire();
            this.flame1 = glyph.getRandomFire();
            this.flame2 = glyph.getRandomFire();
        });

        super.onEvent(MessageBroker, EVENTS.MULTIBALL_ACTIVE, (evt) => this.onMultiballChange(evt));
        super.onEvent(MessageBroker, EVENTS.GAME_STATE_TRANSITION, (newState) => {
            if (newState === 'endBall') {
                this.ballEnded = true;
            }
        });
    }

    enter(evt) {
        super.enter();

        // exiting a multiball ends the current mode and enables mode selector.
        // If the choice from that selector is 'attack', advance both bases, eject holes
        // and start the mode.
        if (evt.from === 'midball') {
            this.advanceBothBases();
            this.deviceQueue.push([
                () => this.bases.left.ejectBallIfPresent(),
                () => this.bases.right.ejectBallIfPresent()
            ]);
        }

        // bases share the same multipliers and red/purple lamps.
        this.bases.left.entity.redLamp.on();
        this.bases.left.entity.purpleLamp.on();

        // they share the multipliers
        if (this.damageMultiplier === 1) {
            this.bases.left.entity.multipliers.off();
        }
        else {
            this.bases.left.entity.multipliers.on(this.damageMultiplier - 2);
        }

        if (this.ballEnded) {
            this.ballEnded = null;
            return;
        }

        // The mode must have just ended due to a destroyed base.

        // Update locks
        const previousLockCount = this._countLockedBalls();
        Object.values(this.bases).forEach((base) => {
            if (base.level === this.lockBallWhenLevelComplete) {
                base.state = 'locked';
            }
        });
        const newLockCount = this._countLockedBalls();
        MessageBroker.emit(EVENTS.BALL_LOCKED, newLockCount);

        // process what to do next
        if (previousLockCount === newLockCount) {
            Object.values(this.bases)
                .filter((base) => base.state !== 'locked' && base.entity.isBallPresent())
                .forEach((base) => {
                    this.advanceBase(base);
                    base.entity.ejectBallIfPresent(); // should be present :)
                });
        }
        else if (newLockCount === 1) {
            MessageBroker.emit(EVENTS.RELEASE_BALL, {});
        }
        else if (newLockCount >= 2) {
            this.startMultiball = true;
        }
    }

    leave() {
        super.leave();
        this.bases.left.entity.redLamp.off();
        this.bases.left.entity.purpleLamp.off();
        this.multiball = false;
    }

    _countLockedBalls() {
        return Object.values(this.bases).filter((base) => base.state === 'locked').length;
    }

    initBaseHealth(base) {
        base.health = base.level * this.healthStep;
    }

    update() {
        if (!this.active) {
            return;
        }

        // start multiball if needed
        if (this.startMultiball) {
            this.startMultiball = false;
            this.multiball = true;
            MessageBroker.emit(EVENTS.MULTIBALL_START, 2);
            this._ejectBase(this.bases.left)
                .then(() => this._ejectBase(this.bases.right));
            return;
        }
        else if (this.exitMultiball) {
            this.exitMultiball = false;
            this.advanceBase(this.bases.left);
            this.advanceBase(this.bases.right);
        }

        // update base state
        Object.values(this.bases)
            .forEach((base) => {
                // if the ball is in the base and we havnt tried to eject it
                if (base.entity.hitSwitch.active && !base.state) {
                    this.hitBase(base);
                }
                else if (base.state === 'hit') {
                    this._ejectBase(base);
                }
                else if (base.state === 'destroyed') {
                    this._destroyBase(base);
                }
                else if (base.state === 'animating') {
                    this.flameUpdater.update();
                }
                else if (base.state === 'reset') {
                    // request to start that mode
                    base.state = 'waiting';
                    MessageBroker.emit('modeSelector_operation', 'timed');
                    MessageBroker.emit(EVENTS.GAME_STATE_TRANSITION, 'selectMode');
                }

                this.updateBaseDisplay(base);
            });

        this.displays.setPlayerDisplay(1, this.scoreComponent.getScore());
        this.displays.setPlayerDisplay(2, '');
        this.displays.setPlayerDisplay(3, this.bases.left.displayState);
        this.displays.setPlayerDisplay(4, this.bases.right.displayState);
    }

    _ejectBase(base) {
        base.state = 'ejecting';
        return base.entity.ejectCoil.on()
            .then(() => {
                setTimeout(() => base.state = null, 500);
            });
    }

    _destroyBase(base) {
        base.state = 'animating';
        setTimeout(() => {
            base.state = 'reset';
        }, 4000);
    }

    advanceBothBases() {
        this.advanceBase(this.bases.left);
        this.advanceBase(this.bases.right);
    }

    advanceBase(base) {
        setTimeout(() => base.state = null, 500);
        base.level++;
        this.initBaseHealth(base);
        base.entity.activateLamp.off();
    }

    hitBase(base) {
        // in multiball, hits dont do damage, they give jackpots.
        if (this.multiball) {
            this.sounds.ROCKET.play();
            base.state = 'hit';
            this.scoreComponent.addScore(this.jackpotValue);
            this.jackpotHitCount++;
            if (this.jackpotHitCount > this.superJackpotHitThreshold) {
                this.jackpotHitCount = 0;
                // TODO: Light the super jackpot (launch?)
            }
        }
        else if (base.health <= 0) {
            // destroy the base
            base.entity.destroyedSound.play();
            base.state = 'destroyed';
            this.scoreComponent.addScore(this.multiball ? this.doulbeJackpotValue : this.destroyScore * base.level);
        }
        else {
            // update health
            base.health = Math.max(0, base.health - (this.damageValue * this.damageMultiplier));

            // play the hit sound
            if (base.health > 0) {
                this.sounds.HIT_SHIELD.play();
            }
            else {
                this.sounds.FALLING.play();
            }

            base.state = 'hit';
            this.scoreComponent.addScore(this.hitScore);
        }

        // if the base's sheilds are down, light the "destroy" light.
        base.entity.activateLamp.setState(base.health <= 0);
    }

    showObjective(show) {
        if (show) {
            this.bases.left.entity.multipliers.chase(250);
            // bases share the same multipliers and red/purple lamps.
            this.bases.left.entity.redLamp.on();
            this.bases.left.entity.purpleLamp.on();
        }
        else {
            // bases share the same multipliers and red/purple lamps.
            this.bases.left.entity.multipliers.stop();
            this.bases.left.entity.redLamp.off();
            this.bases.left.entity.purpleLamp.off();
        }
    }

    updateBaseDisplay(base) {
        if (this.multiball) {
            const jackpotValue =
                this.scoreComponent.formatScoreInThousands(this.jackpotValue, 3);
            base.displayState = `${base.name} ${jackpotValue}`;
        }
        else if (base.state === 'destroyed' || base.state === 'locked' ||
            base.state === 'animating' || base.state === 'waiting'
        ) {
            const baseNameChars = base.name.split('');
            base.displayState = new GlyphCollection(
                baseNameChars[0], baseNameChars[1], ' ',
                this.flame0, this.flame1, this.flame2
            );
        }
        else {
            base.displayState = `${base.name} ${this._getFormattedBaseHealth(base)}`;
        }
    }

    _getFormattedBaseHealth(base) {
        if (base.health < 10) {
            return `  ${base.health}`;
        }
        else if (base.health < 100) {
            return ` ${base.health}`;
        }
        else if (base.health < 1000) {
            return base.health;
        }
        else {
            const healthInK = Math.floor(base.health / 1000);
            return `${healthInK}K`;
        }
    }

    onMultiballChange(evt) {
        if (this.multiball && evt.previousValue && !evt.newValue) {
            this.exitMultiball = true;
        }
        this.multiball = evt.newState;
    }

    reset() {
        this.multiball = false;
        this.jackpotHitCount = 0;
        MessageBroker.emit(EVENTS.BALL_LOCKED, 0);
        this.bases.left.level = 1;
        this.bases.right.level = 1;
        this.bases.left.state = null;
        this.bases.right.state = null;
        this.initBaseHealth(this.bases.left);
        this.initBaseHealth(this.bases.right);
        // bases share the same multipliers and red/purple lamps.
        this.bases.left.entity.redLamp.off();
        this.bases.left.entity.purpleLamp.off();
        this.bases.left.entity.activateLamp.off();
        this.bases.right.entity.activateLamp.off();
    }

    updateDamage(shipCount) {
        // TODO: Add weapons into damageMultiplier
        this.damageValue = 50 + (1 * shipCount);
    }

    getLevel() {
        return Math.max(this.bases.left.level, this.bases.right.level);
    }
}

module.exports = AttackBases;
