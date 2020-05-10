const sinon = require('sinon');
const expect = require('chai').expect;
const {Coil} = require('../src/devices/coil');

describe('coil', () => {
    let coil = null;

    beforeEach(() => {
        coil = new Coil(0, 'test', 'driverType', 100);
        sinon.stub(coil, '_autoOff');
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('on', () => {
        it('isOn is true', () => {
            // setup
            coil._ackOn = true;

            // exercise
            coil.on();

            // check
            expect(coil.isOn).to.be.true;
            expect(coil._ackOn).to.be.null;
        });
    });

    describe('off', () => {
        it('isOn is false', () => {
            // setup
            coil._ackOn = true;
            coil._ackOff = true;

            // exercise
            coil.off();

            // check
            expect(coil.isOn).to.be.false;
            expect(coil._ackOff).to.be.null;
        });

        it('goes auto off', () => {
            // setup
            coil._ackOn = true;
            coil._ackOff = true;
            coil.on();

            // exercise
            coil.off();

            // check
            expect(coil.isOn).to.be.false;
            expect(coil._ackOn).to.be.null;
            expect(coil._ackOff).to.be.null;
        });
    });
});
