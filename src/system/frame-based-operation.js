// const logger = require('./logger');
const MS_PER_FRAME = 33;

/**
 * dsf
 */
class FrameBasedOperation {
    constructor(frameCount, callback) {
        this.frameCount = Math.round(frameCount);
        this.callback = callback;
        this.frames = 0;
    }

    static createByDurationMs(durationMs, callback) {
        return new FrameBasedOperation(durationMs / MS_PER_FRAME, callback);
    }

    updateDurationMs(durationMs) {
        this.frameCount = Math.round(durationMs / MS_PER_FRAME);
    }

    update() {
        // logger.debug(`F=${this.frames} / ${this.frameCount}`);
        if (++this.frames >= this.frameCount) {
            // logger.debug('cb');
            this.callback();
            this.frames = 0;
        }
    }
}

module.exports = FrameBasedOperation;
