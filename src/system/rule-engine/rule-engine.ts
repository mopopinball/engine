import { OUTPUT_DEVICE_TYPES } from "../devices/output-device";
import { DirtyNotifier } from "../dirty-notifier";
import { Action } from "./actions/action";
import { ConditionalAction } from "./actions/conditional-action";
import { DataAction } from "./actions/data-action";
import { DeviceAction } from "./actions/device-action";
import { StateAction } from "./actions/state-action";
import { DesiredOutputState } from "./desired-output-state";
import { RuleData } from "./rule-data";
import { ActionType, ConditionalActionSchema, DataActionSchema, DeviceActionSchema, RuleSchema, StateActionSchema } from "./schema/rule.schema";

export class RuleEngine extends DirtyNotifier {
    static root: RuleEngine;
    active = false;
    data: Map<string, RuleData> = new Map();
    devices: Map<string, DesiredOutputState> = new Map();
    switchActions: Map<string, Action[]> = new Map();
    allActions: Map<string, Action> = new Map();
    children: RuleEngine[] = [];

    constructor(public id: string, public autoStart: boolean) {
        super();
        if (this.id === 'root') {
            RuleEngine.root = this;
        }
    }

    static load(schema: RuleSchema): RuleEngine {
        const engine = new RuleEngine(schema.id, schema.autostart);

        engine.children = schema.children?.map((c) => RuleEngine.load(c)) ?? [];
        for (const child of engine.children) {
            child.onDirty(() => engine.emitDirty());
        }

        for (const deviceSchema of schema.devices ?? []) {
            engine.devices.set(deviceSchema.id, 
                DesiredOutputState.constructFromOutputState(deviceSchema)
            );
        }

        if (schema.actions) {
            for (const action of schema.actions) {
                RuleEngine.createAction(action, engine, action.next);
            }
        }

        if (schema.data) {
            for (const data of schema.data) {
                engine.data.set(data.id, { value: data.value });
            }
        }

        return engine;
    }

    private static createAction(action: DataActionSchema | DeviceActionSchema | StateActionSchema | ConditionalActionSchema, engine: RuleEngine, next: string[]): void {
        let newAction: Action = null;
        switch (action.type) {
            case ActionType.DATA:
                newAction = new DataAction(action.id, action.dataId, action.operation, action.operand, engine.allActions, next);
                break;
            case ActionType.DEVICE:
                newAction = new DeviceAction(action.id, action.deviceId, action.state, engine.allActions, next);
                break;
            case ActionType.STATE: {
                newAction = new StateAction(
                        action.id, 
                        action.startTargetId,
                        action.stopTargetId,
                        engine.allActions,
                        next
                    );
                break;
            }
            case ActionType.CONDITION:
                newAction = new ConditionalAction(
                    action.id, action.statement, action.trueResult, action.falseResult, engine.allActions, next
                );
                break;
            default:
                throw new Error('Not implemented');
        }

        if (action.switchId) {
            engine.addAction(action.switchId, newAction);
        }
        engine.allActions.set(newAction.id, newAction);
        newAction.onDirty(() => {
            engine.emitDirty();
        });
    }

    addAction(switchId: string, action: Action): Action {
        if (!this.switchActions.has(switchId)) {
            this.switchActions.set(switchId, []);
        }
        this.switchActions.get(switchId).push(action);
        return action;
    }

    start(): void {
        // when starting, need to reset any state, or clone it to reset on end?
        this.active = true;
        this.devices.forEach((d) => d.reset());
        this.children
            .filter((child) => child.autoStart)
            .map((c) => c.start());
    }

    stop(): void {
        this.active = false;
        this.children
            .map((c) => c.stop());
    }

    onSwitch(id: string): boolean {
        const childHandled = this.getActiveChildren()
            .map((child) => child.onSwitch(id))
            .reduce((accum, curv) => {
                return accum || curv;
            }, false);

        if (childHandled) {
            return true;
        } else if (this.switchActions.has(id)) {
            for (const action of this.switchActions.get(id)) {
                action.handle(RuleEngine.root.getAllEngines(), this.getData(), this.getDevices());
            }
            return true;
        } else {
            return false;
        }
    }

    // compressed data.
    getData(parentData: Map<string, RuleData> = new Map()): Map<string, RuleData> {
        let newData: Map<string, RuleData> = new Map();
        // copy parent data
        for (const entry of Array.from(parentData.entries())) {
            newData.set(entry[0], entry[1]);
        }
        // copy our data which overwrites parents
        for (const entry of this.data.entries()) {
            newData.set(entry[0], entry[1]);
        }
        // recurse down on our children and repeat.
        for (const activeChild of this.getActiveChildren()) {
            newData = activeChild.getData(newData);
        }

        return newData;
    }

    // compressed devices
    getDevices(parentDevices: Map<string, DesiredOutputState> = new Map()): Map<string, DesiredOutputState> {
        let devices: Map<string, DesiredOutputState> = new Map();
        // copy parent devices
        for (const parentEntry of Array.from(parentDevices.entries())) {
            devices.set(parentEntry[0], parentEntry[1]);
        }
        // copy our devices which overwrites parent's
        for (const entry of this.devices.entries()) {
            devices.set(entry[0], entry[1]);
        }
        // recurse down on our children and repeat.
        for (const activeChild of this.getActiveChildren()) {
            devices = activeChild.getDevices(devices);
        }
        return devices;
    }

    getAllEngines(parentMap: Map<string, RuleEngine> = new Map()): Map<string, RuleEngine> {
        parentMap.set(this.id, this);

        for(const child of this.children) {
            child.getAllEngines(parentMap);
        }

        return parentMap;
    }

    private getActiveChildren(): RuleEngine[] {
        return this.children.filter((c) => c.active);
    }

    toJSON() {
        return {
            devices: Array.from(this.devices.values())
        };
    }
}