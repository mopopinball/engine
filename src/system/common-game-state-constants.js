const COMMON_GAME_STATE_CONSTANTS = {
    STATES: {
        ATTRACT: 'attract',
        PLAY: 'play',
        TEST: 'test'
    },
    TRANSITIONS: {
        START_ATTRACT: 'startAttract',
        START_PLAY: 'startPlay',
        END_BALL: 'endBall',
        END_GAME: 'endGame',
        ENTER_TEST: 'enterTest'
    }
};

module.exports = COMMON_GAME_STATE_CONSTANTS;
