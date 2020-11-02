import { EventEmitter } from "events";
import {Client, connect, IClientPublishOptions} from 'mqtt';
import { logger } from "./logger";

/**
 * Message broker.
 */
export class MessageBroker extends EventEmitter {
    // on(WAN_DOWN, arg1) {
    //     // throw new Error('Method not implemented.');
    // }
    // on(evt, callback) {
    //     super.on(evt, callback);
    // }

    private static instance: MessageBroker;
    private readonly topicToCallbacks: Map<string, CallbackCollection> = new Map();
    private readonly client: Client;

    static getInstance(): MessageBroker {
        if(!MessageBroker.instance) {
            MessageBroker.instance = new MessageBroker();
        }

        return MessageBroker.instance;
    }

    private constructor() {
        super();
        this.client = connect('mqtt://127.0.0.1:1883');
        this.client.on('message', (messageTopic, message) => this._onMqttMessage(messageTopic, message));
    }

    // emit(event: EVENTS | symbol, ...args: any[]): boolean {
    //     return super.emit(event, args);
    // }

    _onMqttMessage(messageTopic: string, message): void {
        // try to find a direct match
        let match = this.topicToCallbacks.get(messageTopic);
        if (!match) {
            // if we didnt find a match, use regex to try to find a topic who's wildcards
            // match the incoming topic.
            match = this._findCallbackCollection(messageTopic);
            if (match) {
                // if we found a wildcard match, add a direct lookup for this too.
                this.topicToCallbacks.set(messageTopic, match);
            }
        }

        if (match) {
            // TODO: FIX
            // match.callbacks.forEach((cb) => cb(messageTopic, message));
        }
    }

    publishRetain(topic: string, message): void {
        const options = {
            retain: true
        } as IClientPublishOptions;
        this.publish(topic, message, options);
    }

    // Publishes to MQTT.
    publish(topic: string, message, options: IClientPublishOptions = null): void {
        this.client.publish(topic, message, options);
    }

    // Subscribe to MQTT.
    subscribe(topic: string, cb: () => void): void {
        let callbackCollection = this._findCallbackCollection(topic);
        if (!callbackCollection) {
            callbackCollection = {
                // topic: topic,
                callbacks: []
            };
            this.topicToCallbacks.set(topic, callbackCollection);
        }
        callbackCollection.callbacks.push(cb);
        this.client.subscribe(topic, (err) => {
            if (err) {
                logger.error(err);
            }
        });
    }

    _findCallbackCollection(messageTopic: string): CallbackCollection {
        const matchingKey = Array.from(this.topicToCallbacks.keys()).find((entry) => {
            const regex = new RegExp(entry.replace(/\+/g, '[\\w\\d]+'));
            return regex.test(messageTopic);
        });

        return matchingKey ? this.topicToCallbacks.get(matchingKey) : null;
    }
}

interface CallbackCollection {
    callbacks: unknown[];
}

export enum EVENTS {
    WAN_DOWN = 'WAN_DOWN',
    MATRIX = 'MATRIX', // switch matrix event
    PIC_VERSION = 'PIC_VERSION',
    IC1_DIPS = 'IC1_DIPS',
    SETUP_GPIO = 'SETUP_GPIO',
    SETUP_GPIO_COMPLETE = 'SETUP_GPIO_COMPLETE',
    OUTPUT_DEVICE_CHANGE = 'OUTPUT_DEVICE_CHANGE',
    OUTPUT_DEVICE_DIRTY = 'OUTPUT_DEVICE_DIRTY',
    ON_GAME_STATE_TRANSITION = 'ON_GAME_STATE_TRANSITION',
    GAME_STATE_TRANSITION = 'GAME_STATE_TRANSITION',
    NEW_GAME_STATE = 'NEW_GAME_STATE',
    FORCE_SELECT_MODE = 'FORCE_SELECT_MODE',
    RELEASE_BALL = 'RELEASE_BALL',
    MULTIBALL_ACTIVE = 'MULTIBALL_ACTIVE',
    BALL_LOCKED = 'BALL_LOCKED',
    MULTIBALL_START = 'MULTIBALL_START',
    ALL_BALLS_PRESENT = 'ALL_BALLS_PRESENT'
}
