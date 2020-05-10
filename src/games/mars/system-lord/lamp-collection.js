/**
 * a colllectino of lamps.
 */
class LampCollection {
    constructor(lamps) {
        this.lamps = lamps;
        this.mode = null;
        this.chaseDelay = null;
        this.frames = 0;
        this.litLamp = 0;
    }

    update() {
        if (this.mode === 'chase') {
            if (++this.frames >= this.chaseDelay) {
                this.lamps.forEach((lamp, i) => lamp.setState(i === this.litLamp));
                this.litLamp = (this.litLamp + 1) % this.lamps.length;
                this.frames = 0;
            }
        }
    }

    chase(intervalMs) {
        this.mode = 'chase';
        // convert interval in frame number
        const seconds = intervalMs / 1000;
        this.chaseDelay = Math.floor(seconds * 30);
    }

    stop() {
        this.off();
    }

    off() {
        this.mode = 'stop';
        this.lamps.forEach((lamp, i) => lamp.off());
    }

    on(index = -1) {
        this.mode = 'stop';
        if (index >= 0) {

        }
        else {
            this.lamps.forEach((lamp, i) => lamp.on());
        }
    }
}

module.exports = LampCollection;
