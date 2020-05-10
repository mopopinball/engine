const {OutputDevice, OUTPUT_DEVICE_TYPES} = require('./output-device');

/** A sound */
class Sound extends OutputDevice {
    constructor(number, description) {
        super(OUTPUT_DEVICE_TYPES.SOUND);
        this.number = number;
        this.description = description;
        // this.playing = false;
        this.state = null;
    }

    play() {
        // this.playing = true;
        this.state = 'playing';
        this._markDirty();
    }

    ack() {
        // this.playing = false;
        this.state = 'ack';
        this._markDirty();
    }

    done() {
        this.state = 'done';
    }

    dirty() {
        return this.state;
    }
}

module.exports = Sound;
