const Switch = require('./switch');

/**
 * tr
 */
class PlayfieldSwitch extends Switch {
    constructor(id, number, name, debounceIntervalMs, qualifiesPlayfield = true) {
        super(id, false, debounceIntervalMs);
        this.number = number;
        this.name = name;
        this.qualifiesPlayfield = qualifiesPlayfield;
    }
}

module.exports = PlayfieldSwitch;
