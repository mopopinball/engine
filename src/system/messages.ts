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

    _onMqttMessage(messageTopic: string, message: Buffer): void {
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
            match.callbacks.forEach((cb) => cb(messageTopic, message.toString()));
        }
    }

    publishRetain(topic: string, message: string): void {
        const options = {
            retain: true
        } as IClientPublishOptions;
        this.publish(topic, message, options);
    }

    // Publishes to MQTT.
    publish(topic: string, message: string, options: IClientPublishOptions = null): void {
        this.client.publish(topic, message, options);
    }

    // Subscribe to MQTT.
    subscribe(topic: string, cb: MqttCallback): void {
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

type MqttCallback = (topic: string, message: string) => void;

interface CallbackCollection {
    callbacks: MqttCallback[];
}

export enum EVENTS {
    WAN_DOWN = 'WAN_DOWN',
    MATRIX = 'MATRIX', // switch matrix event
    PIC_VERSION = 'PIC_VERSION',
    IC1_DIPS = 'IC1_DIPS',
    SETUP_GPIO = 'SETUP_GPIO',
    OUTPUT_DEVICE_CHANGE = 'OUTPUT_DEVICE_CHANGE',
    OUTPUT_DEVICE_DIRTY = 'OUTPUT_DEVICE_DIRTY',
    NEW_RULE_SCHEMA = 'NEW_RULE_SCHEMA'
}

export interface InfoMqttMessage {
    name: string;
    gameName: string;
    version: string;   
}