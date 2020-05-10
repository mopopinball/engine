// const logger = require('../../../util/logger');
// const FrameBasedOperation = require('../../engine/frame-based-operation');

/**
 * war.
 */
class Warbase {
    constructor(
        hitSwitch, activateLamp, redLamp, purpleLamp, multipliers, ejectCoil, sounds,
        scoreComponent, securedSound, destroyedSound
    ) {
        this.hitSwitch = hitSwitch;
        this.activateLamp = activateLamp;
        this.redLamp = redLamp;
        this.purpleLamp = purpleLamp;
        this.multipliers = multipliers;
        this.ejectCoil = ejectCoil;
        this.sounds = sounds;
        this.scoreComponent = scoreComponent;
        this.securedSound = securedSound;
        this.destroyedSound = destroyedSound;
        // this.lampDelay = 30; // 1s
        // this.frames = 0;
        // this.lampBlinker = new FrameBasedOperation(30, () => {
        //     this.activateLamp.toggle();
        // });

        hitSwitch.on('change', (activated) => {
            // logger.debug(JSON.stringify(activated));
            // if (activated) {
            //     this.hitSound.play();
            //     this.scoreComponent.addScore(100);
            // }
        });
    }

    isBallPresent() {
        return this.hitSwitch.active;
    }

    async ejectBallIfPresent() {
        if (this.isBallPresent()) {
            return this.ejectCoil.on();
        }
    }

    update() {
        // this.lampBlinker.update();
    }
}

module.exports = Warbase;
