const sinon = require('sinon');
const expect = require('chai').expect;
const MarsSystemLord = require('../mars-system-lord');
const {MessageBroker, EVENTS} = require('../../../../modules/messages');
const Glyph = require('../../../engine/sys-80-80a-glyphs');

describe('Mars System Lord', () => {
    let game = null;
    beforeEach(() => {
        game = new MarsSystemLord();
        sinon.stub(game, '_setupPics');
    });

    it('enters attract', () => {
        game.startAttract();

        expect(game.state).to.be.equal('attract');
        expect(game.coils.GAME_OVER_RELAY.isOn).to.be.false;
    });

    it('changing state', () => {
        game.startAttract();

        game._gotoState('startPlay');

        // check
        expect(game.state).to.be.equal('play');
    });

    it('fires an event when changing state', (done) => {
        // setup
        MessageBroker.once(EVENTS.NEW_GAME_STATE, (newState) => {
            // check
            expect(newState).to.be.equal('attract');
            done();
        });

        // exercise
        game.startAttract();
    });

    it('only start button exits attract', () => {
        // setup
        game.startAttract();

        // exercise
        game.onSwitchChange(game.switches.RIGHT_FLIPPER, true);

        // check
        expect(game.state).to.be.equal('attract');
    });

    it('starts the game when pressing start', () => {
        // setup
        game.startAttract();

        // exercise
        game.switches.REPLAY.onChange(true);
        // crappy
        game.onAllBallsReady();

        // check
        expect(game.state).to.be.equal('play');
        expect(game.coils.GAME_OVER_RELAY.isOn).to.be.true;
    });

    it('changes the mode until first switch hit', () => {
        // setup
        game.startAttract();
        game.switches.REPLAY.onChange(true);

        game.deviceQueue._process(game.deviceQueue.queue[0]);
        game.deviceQueue._process(game.deviceQueue.queue[1]);
        game.deviceQueue._process(game.deviceQueue.queue[2]);

        // tick the game so the pending tranition to "mode" is processed.
        game.update();

        // exercise & check
        expect(game.modeSelector.selectedMode.id).to.be.equal('attack');
        expect(game.state).to.be.equal('mode');

        game.switches.RIGHT_FLIPPER.onChange(true);
        expect(game.modeSelector.selectedMode.id).to.be.equal('build');

        game.switches.RIGHT_FLIPPER.onChange(true);
        expect(game.modeSelector.selectedMode.id).to.be.equal('attack');

        game.onSwitchChange(game.switches.M_ROLLOVER, true);
        expect(game.state).to.be.equal('attack');
    });

    it('renders fire glyph', () => {
        // setup
        const glyph = new Glyph();
        sinon.stub(glyph, 'getRandomInteger')
            .onFirstCall().returns(0)
            .onSecondCall().returns(1)
            .onThirdCall().returns(2);

        // exercise
        const fire = glyph.getRandomFire();

        // check = 00011110
        expect(fire).to.be.equal(30);
    });
});
