const logger = require('./system/logger');
const StateMachine = require('javascript-state-machine');
const _eval = require('eval');

/**
 * game.
 */
class GameState extends StateMachine {
    constructor(name, gameplayConfig) {
        const states = {};
        const initEntry = Object.entries(gameplayConfig.states || {}).find((entry) => entry[1].init);
        const cc = {
            init: initEntry ? initEntry[0] : undefined,
            transitions: Object.entries(gameplayConfig.states || {}).map((entry) => {
                const entryName = entry[0];
                const state = entry[1];
                // states.push(new GameState(entryName, state));
                states[entryName] = state;
                return {name: `to${state.to}`, from: entryName, to: state.to};
            })
        };
        super(cc);
        this.name = name;
        this.data = gameplayConfig.data;
        this.states = states;

        this.children = Object.entries(gameplayConfig.children || {}).map((cEntry) => {
            return new GameState(cEntry[0], cEntry[1]);
        });

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
                        // todo: getData does not exist
                        const newValue = this.getData(target.id) + target.increment;
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
        return GameState.__getDevice(this, id);
    }

    static __getDevice(obj, id) {
        // depth first: state device, then machine device
        for (const child of obj.children) {
            const device = GameState.__getDevice(child, id);
            if (device !== undefined) {
                return device;
            }
        }

        // get active state device
        const activeState = obj.getActiveStateObj();
        if (activeState && activeState.devices && activeState.devices[id] !== undefined) {
            return activeState.devices[id];
        }
        else {
            return (obj.devices || {})[id];
        }
    }

    getActiveStateObj() {
        return this.states[this.state];
    }

    onAction(id) {
        logger.debug(`Running action: ${id}`);
        const action = GameState.__getAction(this, id);
        if (action) {
            return action.wrapped.map((w) => w());
        }
    }

    static __getAction(obj, id) {
        // depth first state device, then machine device
        for (const child of obj.children) {
            const action = GameState.__getAction(child, id);
            if (action) {
                return action;
            }
        }

        // get active state device
        const activeState = obj.getActiveStateObj();
        const actions = (activeState ? activeState.actions : obj.actions) || {};
        const stateAction = actions[id];
        if (stateAction) {
            return stateAction;
        }
        else {
            return (obj.actions || {})[id];
        }
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
}

module.exports = GameState;
