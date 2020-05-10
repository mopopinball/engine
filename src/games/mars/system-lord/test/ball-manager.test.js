const sinon = require('sinon');
const expect = require('chai').expect;
const BallManager = require('../../../engine/ball-manager');

describe('Ball Manager', () => {
    let ballManager = null;

    const fakeCoil = {
        on: () => {}
    };
    const fakeSwitch = {
        on: () => {}
    };

    beforeEach(() => {
        // multiball game
        ballManager = new BallManager({setBall: () => {}}, 3, fakeSwitch, fakeCoil, fakeSwitch, fakeCoil);
        ballManager.reset();

        sinon.stub(ballManager.outholeCoil, 'on');
        sinon.stub(ballManager, '_endGame');
        sinon.stub(ballManager, '_endBall');
        sinon.stub(ballManager, '_multiBallOver');
    });

    afterEach(() => {
        sinon.restore();
    });

    it('ball drains during attract', () => {
        // exercise
        ballManager.onBallDrain(true);

        // check
        expect(ballManager.outholeCoil.on.callCount).to.be.equal(1);
        expect(ballManager._endGame.callCount).to.be.equal(0);
        expect(ballManager._endBall.callCount).to.be.equal(0);
    });

    it('ball drains during normal play', () => {
        // setup
        ballManager.play();
        ballManager.onBallRelease();
        expect(ballManager.currentBall).to.be.equal(1);

        // exercise
        ballManager.onBallDrain(true);

        // check
        expect(ballManager.currentBall).to.be.equal(2);
        expect(ballManager.numBallsInPlay).to.be.equal(0);
        expect(ballManager._endGame.callCount).to.be.equal(0);
        expect(ballManager._endBall.callCount).to.be.equal(1);
    });

    it('ball drains during normal play while ball locked', () => {
        // setup
        ballManager.play();
        ballManager.onBallRelease();
        ballManager.onBallLocked(1);
        ballManager.onBallRelease();
        expect(ballManager.currentBall).to.be.equal(1);

        // exercise
        ballManager.onBallDrain(true);

        // check
        expect(ballManager.currentBall).to.be.equal(2);
    });

    it('ball 3 drains during normal play', () => {
        // setup
        ballManager.play();
        ballManager.onBallRelease();
        ballManager.currentBall = 3;

        // exercise
        ballManager.onBallDrain(true);

        // check
        expect(ballManager.currentBall).to.be.equal(4);
        expect(ballManager.numBallsInPlay).to.be.equal(0);
        expect(ballManager._endGame.callCount).to.be.equal(1);
    });

    it('play continues when ball drains to one during multiball play', () => {
        // setup
        ballManager.play();
        ballManager.onBallRelease();
        ballManager.onBallLocked(1);
        ballManager.onBallRelease();
        ballManager.onMultiballStart(1);
        expect(ballManager.numBallsInPlay).to.be.equal(2);

        // exercise
        ballManager.onBallDrain(true);

        // check
        expect(ballManager.currentBall).to.be.equal(1);
        expect(ballManager._multiBallOver.callCount).to.be.equal(1);
        expect(ballManager._endBall.callCount).to.be.equal(0);
        expect(ballManager._endGame.callCount).to.be.equal(0);
    });

    it('play continues when ball drains to two during multiball play', () => {
        // setup
        ballManager.play();
        ballManager.onBallRelease();
        ballManager.onBallLocked(1);
        ballManager.onBallRelease();
        ballManager.onBallLocked(2);
        ballManager.onBallRelease();
        ballManager.onMultiballStart(2);
        expect(ballManager.numBallsInPlay).to.be.equal(3);

        // exercise
        ballManager.onBallDrain(true);

        // check
        expect(ballManager.currentBall).to.be.equal(1);
        expect(ballManager._multiBallOver.callCount).to.be.equal(0);
        expect(ballManager._endBall.callCount).to.be.equal(0);
        expect(ballManager._endGame.callCount).to.be.equal(0);
    });

    it('onMultiballStart', () => {
        // setup
        ballManager.play();
        ballManager.onBallRelease();
        ballManager.onBallLocked(1);
        ballManager.onBallRelease();
        ballManager.onBallLocked(2);
        expect(ballManager.lockedBallCount).to.be.equal(2);

        // exercise
        ballManager.onMultiballStart(2);

        // check
        expect(ballManager.lockedBallCount).to.be.equal(0);
        expect(ballManager.numBallsInPlay).to.be.equal(2);
    });

    it('onMultiballStart - multiball starts with subset of locked balls', () => {
        // setup
        ballManager.play();
        ballManager.onBallRelease();
        ballManager.onBallLocked(1);
        ballManager.onBallRelease();
        ballManager.onBallLocked(2);
        ballManager.onBallRelease();
        ballManager.onBallLocked(3);
        expect(ballManager.lockedBallCount).to.be.equal(3);

        // exercise
        ballManager.onMultiballStart(2);

        // check
        expect(ballManager.lockedBallCount).to.be.equal(1);
        expect(ballManager.numBallsInPlay).to.be.equal(3);
        expect(ballManager.getAdjustedNumBallsInPlay()).to.be.equal(2);
    });

    it('ball drains during normal play when extra ball earned', () => {
        // setup
        ballManager.play();
        ballManager.onBallRelease();
        ballManager.addExtraBall();
        expect(ballManager.numExtraBalls).to.be.equal(1);

        // exercise
        ballManager.onBallDrain(true);

        // check
        expect(ballManager.currentBall).to.be.equal(1);
        expect(ballManager.numExtraBalls).to.be.equal(0);
    });

    it('play', () => {
        // exercise
        ballManager.play();

        // check
        expect(ballManager.currentBall).to.be.equal(1);
        expect(ballManager.isGameInProgress).to.be.true;
    });

    it('onBallRelease - when ready', () => {
    });

    it('onBallRelease', () => {
        // setup
        ballManager.play();
        sinon.stub(ballManager, '_delayTroughCoil');

        // exercise
        ballManager.onBallRelease();

        // check
        expect(ballManager.numBallsInPlay).to.be.equal(1);
        expect(ballManager._delayTroughCoil.callCount).to.be.equal(1);
    });

    it('onBallRelease - add ball', () => {
        // setup
        ballManager.play();
        sinon.stub(ballManager, '_delayTroughCoil');
        ballManager.onBallRelease();

        // exercise
        ballManager.onBallRelease();

        // check
        expect(ballManager.numBallsInPlay).to.be.equal(2);
        expect(ballManager._delayTroughCoil.callCount).to.be.equal(2);
    });
});
