const EventEmitter = require('events');
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://127.0.0.1:1883');
const logger = require('./logger');

/**
 * Message broker.
 */
class Messages extends EventEmitter {
    on(WAN_DOWN, arg1) {
        throw new Error('Method not implemented.');
    }
    // on(evt, callback) {
    //     super.on(evt, callback);
    // }

    emit(evt, data) {
        super.emit(evt, data);
    }

    constructor() {
        super();
        this.topicToCallbacks = {};
        client.on('message', (messageTopic, message) => this._onMqttMessage(messageTopic, message));
    }

    _onMqttMessage(messageTopic, message) {
        // try to find a direct match
        let match = this.topicToCallbacks[messageTopic];
        if (!match) {
            // if we didnt find a match, use regex to try to find a topic who's wildcards
            // match the incoming topic.
            match = this._findCallbackCollection(messageTopic);
            if (match) {
                // if we found a wildcard match, add a direct lookup for this too.
                this.topicToCallbacks[messageTopic] = match;
            }
        }

        if (match) {
            match.callbacks.forEach((cb) => cb(messageTopic, message));
        }
    }

    publishRetain(topic, message, options = {}) {
        options.retain = true;
        this.publish(topic, message, options);
    }

    // Publishes to MQTT.
    publish(topic, message, options) {
        client.publish(topic, message, options);
    }

    // Subscribe to MQTT.
    subscribe(topic, cb) {
        let callbackCollection = this._findCallbackCollection(topic);
        if (!callbackCollection) {
            callbackCollection = {
                // topic: topic,
                callbacks: []
            };
            this.topicToCallbacks[topic] = callbackCollection;
        }
        callbackCollection.callbacks.push(cb);
        client.subscribe(topic, (err) => {
            if (err) {
                logger.error(err);
            }
        });
    }

    _findCallbackCollection(messageTopic) {
        const matchingKey = Object.keys(this.topicToCallbacks).find((entry) => {
            const regex = new RegExp(entry.replace(/\+/g, '[\\w\\d]+'));
            return regex.test(messageTopic);
        });

        return matchingKey ? this.topicToCallbacks[matchingKey] : null;
    }
}

const singleton = new Messages();

const EVENTS = {
    WAN_DOWN: 'WAN_DOWN',
    MATRIX: 'MATRIX', // switch matrix event
    PIC_VERSION: 'PIC_VERSION',
    IC1_DIPS: 'IC1_DIPS',
    SETUP_GPIO: 'SETUP_GPIO',
    SETUP_GPIO_COMPLETE: 'SETUP_GPIO_COMPLETE',
    OUTPUT_DEVICE_CHANGE: 'OUTPUT_DEVICE_CHANGE',
    OUTPUT_DEVICE_DIRTY: 'OUTPUT_DEVICE_DIRTY',
    ON_GAME_STATE_TRANSITION: 'ON_GAME_STATE_TRANSITION',
    GAME_STATE_TRANSITION: 'GAME_STATE_TRANSITION',
    NEW_GAME_STATE: 'NEW_GAME_STATE',
    FORCE_SELECT_MODE: 'FORCE_SELECT_MODE',
    RELEASE_BALL: 'RELEASE_BALL',
    MULTIBALL_ACTIVE: 'MULTIBALL_ACTIVE',
    BALL_LOCKED: 'BALL_LOCKED',
    MULTIBALL_START: 'MULTIBALL_START',
    ALL_BALLS_PRESENT: 'ALL_BALLS_PRESENT'
};

module.exports = {MessageBroker: singleton, EVENTS};
