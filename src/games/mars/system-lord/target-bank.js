const EventEmitter = require('events');

/**
 * A bank of targets.
 */
class TargetBank extends EventEmitter {
    constructor(resetCoil, lampCollection, switchArray) {
        super();
        this.resetCoil = resetCoil;
        this.lampCollection = lampCollection;
        this.switchArray = switchArray;

        this.switchArray.forEach((sw) => {
            sw.on('active', () => this.onTargetDown());
        });
    }

    onTargetDown() {
        // update the lamps to match the switch state
        for (let i = 0; i < this.lampCollection.lamps.length; i++) {
            this.lampCollection.lamps[i].setState(!this.switchArray[i].active);
        }
        this.emit('targetDown', true);
    }

    isAllTargetsDown() {
        return this.switchArray.filter((sw) => sw.active).length === this.switchArray.length;
    }

    isAnyTargetDown() {
        return this.switchArray.filter((sw) => sw.active).length > 0;
    }

    update() {
        this.lampCollection.update();
    }

    lampsOff() {
        this.lampCollection.stop();
    }

    lampsOn() {
        this.lampCollection.on();
    }

    chase(interval) {
        this.lampCollection.chase(interval);
    }

    async reset() {
        this.lampCollection.on();
        if (this.isAnyTargetDown()) {
            return this.resetCoil.on();
        }
    }
}

module.exports = TargetBank;
