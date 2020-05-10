const bufferOperations = require('bitwise/buffer');
// const sinon = require('sinon');
const expect = require('chai').expect;

describe('driver', () => {
    // let network = null;
    // beforeEach(() => {
    //     network = new Wlan();
    // });

    describe('set bits', () => {
        it('set bits in buffer', () => {
            // setup
            const buffer = Buffer.alloc(2);

            // test
            bufferOperations.modify(buffer, [1, 1, 0, 1], 4);

            // check
            expect(buffer[0]).to.be.equal(13);
        });

        it('set bits in buffer across bytes', () => {
            // setup
            const buffer = Buffer.alloc(2);

            // test
            bufferOperations.modify(buffer, [1, 1, 0, 1], 6);

            // check
            expect(buffer[0]).to.be.equal(3);
            expect(buffer[1]).to.be.equal(64);
        });
    });
});
