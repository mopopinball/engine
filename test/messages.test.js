// const bufferOperations = require('bitwise/buffer');
// const sinon = require('sinon');
const expect = require('chai').expect;
const {MessageBroker} = require('../src/system/messages');

describe('messages', () => {
    beforeEach(() => {
        MessageBroker.topicToCallbacks = [];
    });

    describe('subscribe', () => {
        it('registers callback and calls it', (done) => {
            // setup

            // test
            MessageBroker.subscribe('a/b', () => done());

            // check
            expect(Object.keys(MessageBroker.topicToCallbacks).length).to.be.equal(1);
            MessageBroker._onMqttMessage('a/b', 'test');
        });

        it('calls callback with single level wild cards', (done) => {
            // setup
            MessageBroker.subscribe('a/+/c', () => {
                expect(Object.keys(MessageBroker.topicToCallbacks).length).to.be.equal(2);
                done();
            });

            // test
            MessageBroker._onMqttMessage('a/b/c', 'test');
        });

        it('calls callback with multiple single level wild cards', (done) => {
            // setup
            MessageBroker.subscribe('a/+/+/d', () => {
                // expect(Object.keys(MessageBroker.topicToCallbacks).length).to.be.equal(2);
                done();
            });

            // test
            MessageBroker._onMqttMessage('a/b/55/d', 'test');
        });
    });
});
