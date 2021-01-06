import {padStart, padEnd} from 'lodash';

export enum DisplayId {
    PLAYER1 = 'p1',
    PLAYER2 = 'p2',
    PLAYER3 = 'p3',
    PLAYER4 = 'p4',
    CREDITS = 'c',
    BALLNUM = 'b'
}

/**
 * A System 80, 80A style display.
 */
export class Sys80or80ADisplay {
    player1: string;
    player2: string;
    player3: string;
    player4: string;
    _credits: string;
    _ballNumber: string;
    status: string;
    
    constructor() {
        this.player1 = this.leftPad('');
        this.player2 = this.leftPad('');
        this.player3 = this.leftPad('');
        this.player4 = this.leftPad('');
        this.setStatus('', '');
    }

    setCredits(credits: string): void {
        this._credits = credits;
        this._updateStatus();
    }

    setBall(ballNumber: string): void {
        this._ballNumber = ballNumber;
        this._updateStatus();
    }

    setStatus(creditsText: string, ballText: string): void {
        this._credits = creditsText;
        this._ballNumber = ballText;
        this._updateStatus();
    }

    setPlayerDisplay(playerNumber: 1 | 2 | 3 | 4, stringValue: string): void {
        const paddedValue = this.leftPad(stringValue);
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

    _updateStatus(): void {
        const credits = this.leftPad(this._credits, 2);
        const ball = this.leftPad(this._ballNumber, 2);
        this.status = `${credits}${ball}`;
    }

    // Pads the given string on the left to the desired length.
    leftPad(value = '', desiredLength = 6): string {
        return padStart(value, desiredLength);
    }

    rightPad(value = '', desiredLength = 6): string {
        return padEnd(value, desiredLength);
    }

    getHash(): string {
        const p1Hash = typeof this.player1 === 'string' ? this.player1 : JSON.stringify(this.player1);
        const p2Hash = typeof this.player2 === 'string' ? this.player2 : JSON.stringify(this.player2);
        const p3Hash = typeof this.player3 === 'string' ? this.player3 : JSON.stringify(this.player3);
        const p4Hash = typeof this.player4 === 'string' ? this.player4 : JSON.stringify(this.player4);
        return `${p1Hash}${p2Hash}${p3Hash}${p4Hash}${this.status}`;
    }
}