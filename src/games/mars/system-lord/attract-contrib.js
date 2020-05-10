/**
 * Attract.
 */
class MarsAttractConrib {
    constructor(displays) {
        this.displays = displays;
    }

    update() {
    }

    activate() {
        this.displays.player1 = this.displays.rightPad('Can');
        this.displays.player2 = this.displays.rightPad('you');
        this.displays.player3 = this.displays.rightPad('defeat');
        this.displays.player4 = this.displays.rightPad('Mars');
    }

    deactivate() {
    }
}

module.exports = MarsAttractConrib;
