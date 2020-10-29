const logger = require('./logger');

/**
 * Provides FPS tracking.
 */
export class FpsTracker {
    loopTimes: number[] = [];
    constructor() {
        // sample the loop time. Lower is better.
        setInterval(() => this.printLoopTime(), 60 * 1000);
    }

    sampleLoopTime(loopTime: number): void {
        this.loopTimes.push(loopTime);
        if (this.loopTimes.length > 100) {
            this.loopTimes.shift();
        }
    }

    printLoopTime(): void {
        if (this.loopTimes.length === 0) {
            return;
        }
        const sum = this.loopTimes.reduce((previous, current) => current += previous);
        const avg = sum / this.loopTimes.length;
        logger.info(`Loop time: ${avg}`);
        logger.debug(JSON.stringify(this.loopTimes));
    }
}
