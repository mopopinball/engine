const FrameBasedOperation = require('./frame-based-operation');

/**
 * Manages attract mode.
 */
class Attract {
    constructor() {
        this.active = false;
        this.renderIndex = 0;
        this.renderIndexUpdater = FrameBasedOperation.createByDurationMs(10 * 1000, () => this.updateRenderIndex());
    }

    onAttract(attractContributors) {
        this.contributors = attractContributors;
        this.renderIndex = 0;
        this.updateRenderIndex();
        this.active = true;
    }

    onLeaveAttract() {
        this.active = false;
        this.contributors.forEach((contrib) => contrib.deactivate());
    }

    update() {
        if (!this.active) {
            return;
        }

        this.renderIndexUpdater.update();

        this.contributors[this.renderIndex].update();
    }

    updateRenderIndex() {
        this.deactiveCurrent();
        this.renderIndex = (this.renderIndex + 1) % this.contributors.length;
        this.activateCurrent();
    }

    deactiveCurrent() {
        this.contributors[this.renderIndex].deactivate();
    }

    activateCurrent() {
        this.contributors[this.renderIndex].activate();
    }
}

module.exports = Attract;
