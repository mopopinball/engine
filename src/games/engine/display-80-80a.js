const _ = require('lodash');

/**
 * A System 80, 80A style display.
 */
class Display {
    constructor() {
        this.type = '80/80a';
        this.player1 = this.leftPad('');
        this.player2 = this.leftPad('');
        this.player3 = this.leftPad('');
        this.player4 = this.leftPad('');
        this.setStatus('FP', '');
    }

    onPlay() {
    }

    setCredits(credits) {
        this._credits = credits;
        this._updateStatus();
    }

    setBall(ballNumber) {
        this._ballNumber = ballNumber;
        this._updateStatus();
    }

    setStatus(creditsText, ballText) {
        this._credits = creditsText;
        this._ballNumber = ballText;
        this._updateStatus();
    }

    setPlayerDisplay(playerNumber, stringValue) {
        const paddedValue = typeof stringValue === 'object' ?
            stringValue :
            this.leftPad(stringValue);
        if (playerNumber === 1) {
            this.player1 = paddedValue;
        }
        else if (playerNumber === 2) {
            this.player2 = paddedValue;
        }
        else if (playerNumber === 3) {
            this.player3 = paddedValue;
        }
        else {
            this.player4 = paddedValue;
        }
    }

    _updateStatus() {
        const credits = this.leftPad(this._credits, 2);
        const ball = this.leftPad(this._ballNumber, 2);
        this.status = `${credits}${ball}`;
    }

    // Pads the given string on the left to the desired length.
    leftPad(value = '', desiredLength = 6) {
        return _.padStart(value, desiredLength);
    }

    rightPad(value = '', desiredLength = 6) {
        return _.padEnd(value, desiredLength);
    }

    getHash() {
        const p1Hash = typeof this.player1 === 'string' ? this.player1 : JSON.stringify(this.player1);
        const p2Hash = typeof this.player2 === 'string' ? this.player2 : JSON.stringify(this.player2);
        const p3Hash = typeof this.player3 === 'string' ? this.player3 : JSON.stringify(this.player3);
        const p4Hash = typeof this.player4 === 'string' ? this.player4 : JSON.stringify(this.player4);
        return `${p1Hash}${p2Hash}${p3Hash}${p4Hash}${this.status}`;
    }
}

module.exports = Display;
