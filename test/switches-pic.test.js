const SwitchesPic = require('../src/devices/switches-pic');
const sinon = require('sinon');
const expect = require('chai').expect;

describe('switches pic', () => {
    let pic = null;
    beforeEach(() => {
        pic = new SwitchesPic();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('misc', () => {
        it('clears the buffer', () => {
            const buffer = Buffer.alloc(2);
            expect(buffer[0]).to.be.equal(0);
            expect(buffer[1]).to.be.equal(0);

            buffer[0] = 0xDD;
            buffer[1] = 0x11;

            // set to zero
            buffer[0] = 0;
            buffer[1] = 0;

            expect(buffer[0]).to.be.equal(0);
            expect(buffer[1]).to.be.equal(0);
        });
    });

    describe('_readNibble', () => {
        it('reads the bits', async () => {
            // setup
            sinon.stub(pic._data0, 'read')
                .resolves(false);
            sinon.stub(pic._data1, 'read')
                .resolves(true);
            sinon.stub(pic._data2, 'read')
                .resolves(false);
            sinon.stub(pic._data3, 'read')
                .resolves(true);

            // exercise
            const byte = await pic._readNibble();

            // check
            expect(byte).to.be.equal(0x05);
        });
    });

    describe('_readData', () => {
        it.skip('reads and messages matrix event', async () => {
            // setup
            sinon.stub(pic, '_sendAck')
                .resolves();
            sinon.stub(pic, '_readNibble')
                .onFirstCall().resolves(0x08)
                .onSecondCall().resolves(0x0B) // 11
                .onThirdCall().resolves(0x08)
                .onCall(3).resolves(0x00);
            sinon.stub(pic, 'sendMessage');

            // exercise
            await pic._readData();
            await pic._readData();
            await pic._readData();
            await pic._readData();

            // check
            expect(pic.sendMessage.lastCall.args[1].switch).to.be.equal(13);
            expect(pic.sendMessage.lastCall.args[1].activated).to.be.true;
        });

        it.skip('reads and messages version event', async () => {
            // setup
            sinon.stub(pic, '_sendAck')
                .resolves();
            sinon.stub(pic, '_readNibble')
                .onFirstCall().resolves(0x00)
                .onSecondCall().resolves(0x0D)
                .onThirdCall().resolves(0x07)
                .onCall(3).resolves(0x00);
            sinon.stub(pic, 'sendMessage');

            // exercise
            await pic._readData();
            await pic._readData();
            await pic._readData();
            await pic._readData();

            // check
            expect(pic.sendMessage.lastCall.args[1].version).to.be.equal('13.7.0');
        });
    });

    describe('getParity', () => {
        it('returns true for odd parity', () => {
            // exercise
            const parity = pic.getParity(13);

            // check
            expect(parity).to.be.true;
        });

        it('returns false of even parity', () => {
            // exercise
            const parity = pic.getParity(5);

            // check
            expect(parity).to.be.false;
        });
    });

    describe('isParityOk', () => {
        it('returns true for ok parity', () => {
            // exercise
            // [1101][0101][1101] expects [1011]
            pic.payload = [0xD5, 0xDB];
            const isOk = pic.isParityOk();

            // check
            expect(isOk).to.be.true;
        });

        it('returns false for bad parity', () => {
            // exercise
            // [1101][1101][1101] expects [1011]
            pic.payload = [0xDD, 0xDB];
            const isOk = pic.isParityOk();

            // check
            expect(isOk).to.be.false;
        });
    });

    describe('_onDipPayload', () => {
        it('parses bytes correctly', () => {
            // setup (op code is incorrect)
            // [1101][0101][1101][1011]
            pic.payload = [0xD5, 0xDB];
            sinon.stub(pic, 'reportDips');

            // exercise
            pic._onDipPayload();

            // check
            expect(pic.k1_1).to.be.equal(0);
            expect(pic.k1_2).to.be.equal(1);
            expect(pic.k1_3).to.be.equal(0);
            expect(pic.k1_4).to.be.equal(1);
            expect(pic.k1_5).to.be.equal(0);
            expect(pic.s1_1).to.be.equal(1);
            expect(pic.s1_3).to.be.equal(1);
            expect(pic.s1_4).to.be.equal(1);
            expect(pic.s1_5).to.be.equal(0);
            expect(pic.slam).to.be.equal(1);
        });
    });
});
