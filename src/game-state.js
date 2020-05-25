const logger = require('./system/logger');
const StateMachine = require('javascript-state-machine');
const _eval = require('eval');
const _ = require('lodash');

/**
 * game.
 */
class GameState extends StateMachine {
    constructor(name, gameplayConfig) {
        const states = {};
        const initEntry = Object.entries(gameplayConfig.states || {}).find((entry) => entry[1].init);
        const initState = initEntry ? initEntry[0] : undefined;
        const cc = {
            init: initState,
            transitions: Object.entries(gameplayConfig.states || {})
            // TODO: Add filter and fix tests.
                // .filter((ent) => ent[1].to)
                .map((entry) => {
                    const entryName = entry[0];
                    const state = entry[1];
                    states[entryName] = state;
                    return {name: `to${state.to}`, from: entryName, to: state.to};
                })
                .concat([{name: 'reset', from: '*', to: initState}])
        };
        super(cc);
        this.name = name;
        this.data = gameplayConfig.data;
        this.states = states;

        this.children = Object.entries(gameplayConfig.children || {}).map((cEntry) => {
            return new GameState(cEntry[0], cEntry[1]);
        });
        for (const stateEntry of Object.entries(GameState._makeObj(this.states))) {
            stateEntry[1].children = Object.entries(GameState._makeObj(stateEntry[1].children)).map((cEntry) => {
                return new GameState(cEntry[0], cEntry[1]);
            });
        }

        this.devices = gameplayConfig.devices;

        this.actions = gameplayConfig.actions || {};
        this.wrapActions(this.actions);
        Object.values(this.states).forEach((s) => this.wrapActions(s.actions));

        // output devices[] lamps, coils, relays, sounds, displays
        // input devices[] switches
        // state actions, handled first, can bubble?, depth first: state transition, function
        // actions: state transition, function
        // state data
        // machine data

        // each game loop queries depth first the state of output devices until all output devices
        // are checked. thus prefers specific behaviour over general behavoiur and returns to general
        // behaviour when state exits
    }

    getAllDeviceStates() {
        this.deviceIds = new Set();
        GameState._addToDeviceSet(this.deviceIds, this);
        return Array.from(this.deviceIds);
    }

    static _addToDeviceSet(set, obj) {
        for (const deviceId of Object.keys(obj.devices || {})) {
            set.add(deviceId);
        }

        const activeState = obj.getActiveStateObj ? obj.getActiveStateObj() : null;
        if (activeState) {
            GameState._addToDeviceSet(set, activeState);
        }

        for (const child of obj.children || []) {
            GameState._addToDeviceSet(set, child);
        }
    }

    wrapActions(actions = {}) {
        for (const action of Object.values(actions)) {
            if (!action.type) {
                throw new Error('Actions require a type');
            }
            else if (['switch', 'interval', 'timeout', 'collection'].indexOf(action.type) < 0) {
                throw new Error('Invalid action type');
            }
            action.wrapped = [];
            for (const target of action.targets) {
                action.wrapped.push(this._wrapTarget(target));
            }
        }
    }

    _wrapTarget(target) {
        if (typeof target === 'function') {
            return target.bind(this);
        }
        else if (typeof target === 'object') {
            if (target.type === 'state') {
                return () => {
                    this['to' + target.target]();
                };
            }
            else if (target.type === 'data') {
                if (target.increment !== undefined) {
                    return () => {
                        const compressed = this.getCompressedState();
                        const newValue = compressed.data[target.id] + target.increment;
                        this.setData(target.id, newValue);
                    };
                }
                else {
                    return () => this.setData(target.id, target.value);
                }
            }
            else if (target.type === 'conditional') {
                const evaluatedCondition = _eval(`module.exports = function() { return ${target.condition}}`);
                const wrappedCondition = this._wrapTarget(evaluatedCondition);
                const wrappedTrue = this._wrapTarget(target.true);
                const wrappedFalse = this._wrapTarget(target.false);
                return () => wrappedCondition() ? wrappedTrue() : wrappedFalse();
            }
        }
    }

    getDeviceState(id) {
        const compressed = this.getCompressedState();
        return compressed.devices[id];
    }

    getActiveStateObj() {
        return this.states[this.state];
    }

    getActiveTimers() {
        const compressed = this.getCompressedState();
        const timers = compressed.actions || {};
        return Object.values(timers).filter((a) => a.type === 'interval' || a.type === 'timeout');
    }

    onAction(id) {
        logger.debug(`Running action: ${id}`);
        const compressed = this.getCompressedState();
        const actions = Object.entries(compressed.actions).filter((entry) => {
            return entry[0] === id || entry[1].type === 'collection';
        }).map((entry2) => entry2[1]);
        let results = [];
        for (const action of actions) {
            results = results.concat(action.wrapped.map((w) => w()));
        }
        return results;
    }

    setData(id, value) {
        GameState.__setData(this, id, value);
    }

    static __setData(obj, id, value) {
        // depth first state device, then machine device
        for (const child of obj.children) {
            const dataSet = GameState.__setData(child, id, value);
            if (dataSet) {
                return true;
            }
        }

        // get active state device
        const activeState = obj.getActiveStateObj();
        if (activeState && activeState.data && activeState.data[id] !== undefined) {
            activeState.data[id] = value;
            return true;
        }
        else if (obj.data && obj.data[id] !== undefined) {
            obj.data[id] = value;
            return true;
        }
        else {
            return false;
        }
    }

    static _makeObj(candidate) {
        return candidate || {};
    }

    getCompressedState() {
        const result = {
            data: {},
            devices: {},
            actions: {}
        };
        this._compress(this, result);
        return result;
    }

    _compress(obj, result) {
        // merge our machine level properties
        _.merge(result.data, obj.data);
        _.merge(result.devices, obj.devices);
        _.merge(result.actions, obj.actions);

        // get active state device
        const activeState = obj.getActiveStateObj();
        if (activeState) {
            // merge our state level properties
            _.merge(result.data, activeState.data);
            _.merge(result.devices, activeState.devices);
            _.merge(result.actions, activeState.actions);
            for (const child of activeState.children) {
                this._compress(child, result);
            }
        }

        // recurse for children
        for (const child of obj.children) {
            this._compress(child, result);
        }
    }

    onLeaveState(transition) {
        if (!this.states) {
            return;
        }
        // If we're leaving a state and that state has children, reset each child sm
        // to its 'init' state.
        for (const child of this.states[transition.from].children) {
            child.reset();
        }
    }
}

module.exports = GameState;
