const logger = require('../../../util/logger');
const _ = require('lodash');

/**
 * sdf
 */
class ScoreComponent {
    constructor() {
        this.score = 0;
    }

    reset() {
        this.score = 0;
    }

    addScore(amount) {
        this.score += amount;
        logger.debug(`Score: ${this.score}`);
    }

    getScore() {
        return this.score;
    }

    /**
     * Formats the given score in thousands, eg 10K, 100K, 500K.
     * @param {number} score The score to format.
     * @param {boolean} padLength Left pads the returned value if provided.
     * @return {string} A string formatted score.
     */
    formatScoreInThousands(score, padLength) {
        if (score < 1000) {
            return score;
        }
        else {
            const scoreInK = Math.floor(score / 1000);
            const formattedString = `${scoreInK}K`;
            return padLength ? _.padStart(formattedString, padLength) : formattedString;
        }
    }
}

module.exports = ScoreComponent;
