const bitwise = require('bitwise');
const Utils = require('../../modules/utils');

/**
 * Special glyphs.
 * Characters are basically as https://images.app.goo.gl/rGKSpnGag5hFhUdj6 plus "H" in the middle column.
 */
class Glyphs {
    getRandomFire() {
        const middleFlame = this.getRandomInteger(0, 2);
        const leftFlame = this.getRandomInteger(0, 3);
        const rightFlame = this.getRandomInteger(0, 3);
        let bits = [
            middleFlame,
            0
        ];
        bits = bits
            .concat(this.getFlame(leftFlame))
            .concat([1])
            .concat(this.getFlame(rightFlame, true))
            .concat([0]);
        const number = bitwise.byte.write(bits);
        return number;
    }

    getFlame(number, invert = false) {
        if (number === 0) {
            return [0, 0];
        }
        else if (number === 1 && !invert) {
            return [0, 1];
        }
        else if (number === 1 && invert) {
            return [1, 0];
        }
        else {
            return [1, 1];
        }
    }

    getRandomInteger(min, max) {
        return Utils.getRandomInteger(min, max);
    }
}

module.exports = Glyphs;
