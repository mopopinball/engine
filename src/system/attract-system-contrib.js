/**
 * System attract contributor
 */
class AttractSystem {
    constructor(displays) {
        this.displays = displays;
        this.state = 0;
        this.interval = 2500;
    }

    update() {
    }

    activate() {
        this.attractInterval = setInterval(() => {
            this.state = this.state === 0 ? 1 : 0;
            this._updateStatus();
        }, this.interval);
        this._updateStatus();
    }

    deactivate() {
        clearInterval(this.attractInterval);
    }

    _updateStatus() {
        if (this.state === 0) {
            this.renderState0();
        }
        else if (this.state === 1) {
            this.renderState1();
        }
    }

    renderState0() {
        this.displays.player1 = this.displays.rightPad('Mopo');
        this.displays.player2 = this.displays.rightPad('Pin');
        this.displays.player3 = this.displays.rightPad('Press');
        this.displays.player4 = this.displays.rightPad('Start');
    }

    renderState1() {
        this.displays.player1 = this.displays.rightPad('Mopo');
        this.displays.player2 = this.displays.rightPad('Pin');
        this.displays.player3 = this.displays.leftPad('Free');
        this.displays.player4 = this.displays.rightPad('Play');
    }
}

module.exports = AttractSystem;
