import {padStart, padEnd} from 'lodash';
import { Style } from './styles/style';

export enum DisplayId {
    PLAYER1 = 'p1',
    PLAYER2 = 'p2',
    PLAYER3 = 'p3',
    PLAYER4 = 'p4',
    CREDITS = 'c',
    BALLNUM = 'b'
}

interface DisplayState {
    initValue: string;
    currentValue: string;
    styles?: Style[];
    dirty: boolean;
}

/**
 * A System 80, 80A style display.
 */
export class Sys80or80ADisplay {
    player1: DisplayState;
    player2: DisplayState;
    player3: DisplayState;
    player4: DisplayState;
    private _credits: DisplayState;
    private _ballNumber: DisplayState;
    status: DisplayState;
    
    constructor() {
        this.player1 = this.createDisplayState(this.leftPad(''));
        this.player2 = this.createDisplayState(this.leftPad(''));
        this.player3 = this.createDisplayState(this.leftPad(''));
        this.player4 = this.createDisplayState(this.leftPad(''));
        this._credits = this.createDisplayState(this.leftPad('', 2));
        this._ballNumber = this.createDisplayState(this.leftPad('', 2));
        this.status = this.createDisplayState('');
        this._updateStatus();
    }

    setCredits(credits: string, styles?: Style[]): void {
        this.updateDisplayState(this._credits, credits, styles);
        this._updateStatus();
    }

    setBall(ballNumber: string, styles?: Style[]): void {
        this.updateDisplayState(this._ballNumber, ballNumber, styles);
        this._updateStatus();
    }

    setPlayerDisplay(playerNumber: 1 | 2 | 3 | 4, stringValue: string, styles?: Style[]): void {
        const paddedValue = this.leftPad(stringValue);
        if (playerNumber === 1) {
            this.updateDisplayState(this.player1, paddedValue, styles);
        }
        else if (playerNumber === 2) {
            this.updateDisplayState(this.player2, paddedValue, styles);
        }
        else if (playerNumber === 3) {
            this.updateDisplayState(this.player3, paddedValue, styles);
        }
        else {
            this.updateDisplayState(this.player4, paddedValue, styles);
        }
    }

    update(): void {
        this.updateDisplayForStyle(this.player1);
        this.updateDisplayForStyle(this.player2);
        this.updateDisplayForStyle(this.player3);
        this.updateDisplayForStyle(this.player4);
        this.updateDisplayForStyle(this.status);
    }

    private updateDisplayForStyle(display: DisplayState): void {
        if (!display.styles) {
            return;
        }
        
        for(const style of display.styles) {
            const newCurrentValue = style.update() as string;
            display.dirty = newCurrentValue !== display.currentValue;
            display.currentValue = newCurrentValue;
        }
    }

    private createDisplayState(value: string, styles: Style[] = []): DisplayState {
        return {
            currentValue: value,
            initValue: value,
            dirty: true,
            styles: styles
        };
    }

    private updateDisplayState(displayState: DisplayState, value: string, styles?: Style[]): void {
        displayState.currentValue = value;
        displayState.initValue = value;
        displayState.styles = styles;
        displayState.dirty = true;
    }

    private _updateStatus(): void {
        const credits = this.leftPad(this._credits.currentValue, 2);
        const ball = this.leftPad(this._ballNumber.currentValue, 2);
        this.updateDisplayState(this.status, `${credits}${ball}`);
    }

    // Pads the given string on the left to the desired length.
    private leftPad(value = '', desiredLength = 6): string {
        return padStart(value, desiredLength);
    }

    private rightPad(value = '', desiredLength = 6): string {
        return padEnd(value, desiredLength);
    }

    getIsDirty(): boolean {
        return this.player1.dirty || this.player2.dirty || this.player3.dirty || this.player4.dirty || this.status.dirty;
    }

    public clean(): void {
        this.player1.dirty = false;
        this.player2.dirty = false;
        this.player3.dirty = false;
        this.player4.dirty = false;
        this.status.dirty = false;
    }
}