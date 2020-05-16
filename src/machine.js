const GameState = require('./game-state');

/**
 * teste.
 */
class Machine {
    constructor(hardwareConfig, gameplayConfig) {
        this.config = hardwareConfig;
        this.rootState = new GameState(gameplayConfig);

        this.gameplayConfig = {
            data: {},
            actions: [{
                id: 'sw1',
                target: 'newState'
            }, {
                id: 'sw2',
                target: (args) => {}
            }],
            states: [{
                stateA: {
                    data: {},
                    actions: [{
                        id: 'sw3',
                        target: require('something')()
                    }, {
                        id: 'sw4',
                        target: (lamp, method, ...args) => lamp[method](args)
                    }]
                }
            }]
        };
    }
}

module.exports = Machine;
