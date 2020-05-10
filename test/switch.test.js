const sinon = require('sinon');
const expect = require('chai').expect;
const Switch = require('../src/devices/switch');

describe.skip('switch', () => {
    it('has default debounce and suppresses', () => {
        // setup
        const sw = new Switch('test', false, 50);
        sinon.stub(sw, '_publish');
        sinon.stub(sw, '_getNow')
            .onFirstCall().returns(1000)
            .onSecondCall().returns(1010)
            .onThirdCall().returns(1020);

        // exercise
        sw.onChange(true);
        sw.onChange(false);
        sw.onChange(true);

        // check
        expect(sw._publish.callCount).to.be.equal(1);
    });

    it('has default debounce and publishes', () => {
        // setup
        const sw = new Switch('test', false, 50);
        sinon.stub(sw, '_publish');
        sinon.stub(sw, '_getNow')
            .onFirstCall().returns(1000)
            .onSecondCall().returns(1010)
            .onThirdCall().returns(1060);

        // exercise
        sw.onChange(true);
        sw.onChange(false);
        sw.onChange(true);

        // check
        expect(sw._publish.callCount).to.be.equal(2);
    });
});
