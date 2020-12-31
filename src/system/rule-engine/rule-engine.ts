import { DirtyNotifier } from "../dirty-notifier";
import { logger } from "../logger";
import { Action } from "./actions/action";
import { ActionTriggerType } from "./actions/action-trigger";
import { ConditionalAction } from "./actions/conditional-action";
import { DataAction } from "./actions/data-action";
import { DeviceAction } from "./actions/device-action";
import { IdActionTrigger } from "./actions/id-action-trigger";
import { StateAction } from "./actions/state-action";
import { SwitchActionTrigger } from "./actions/switch-action-trigger";
import { DesiredOutputState } from "./desired-output-state";
import { RuleData } from "./rule-data";
import { ActionType, IdActionTriggerSchema, RuleSchema, SwitchActionTriggerSchema, TriggerType } from "./schema/rule.schema";

export class RuleEngine extends DirtyNotifier {
    static root: RuleEngine;
    active = false;
    name: string;
    description: string;
    data: Map<string, RuleData> = new Map();
    devices: Map<string, DesiredOutputState> = new Map();
    triggers: ActionTriggerType[] = [];
    children: RuleEngine[] = [];

    constructor(public id: string, public autoStart: boolean, private readonly parent: RuleEngine) {
        super();
        if (this.id === 'root') {
            RuleEngine.root = this;
        }
    }

    static load(schema: RuleSchema, parent: RuleEngine = null): RuleEngine {
        const engine = new RuleEngine(schema.id, schema.autostart, parent);
        engine.name = schema.metadata?.name;
        engine.description = schema.metadata?.description;
        engine.children = schema.children?.map((c) => RuleEngine.load(c, engine)) ?? [];
        for (const child of engine.children) {
            child.onDirty(() => engine.emitDirty());
        }

        for (const deviceSchema of schema.devices ?? []) {
            engine.devices.set(deviceSchema.id, 
                DesiredOutputState.constructFromOutputState(deviceSchema)
            );
        }

        if (schema.triggers) {
            for (const trigger of schema.triggers) {
                try {
                    engine.createTrigger(trigger);
                }
                catch(e) {
                    // logger.error(e);                    
                }
            }
        }

        if (schema.data) {
            for (const data of schema.data) {
                engine.data.set(data.id, {id: data.id, value: data.value, initValue: data.value });
            }
        }

        return engine;
    }

    public createTrigger(triggerSchema: SwitchActionTriggerSchema | IdActionTriggerSchema): void {
        // First, find or create the incoming trigger.
        let trigger: ActionTriggerType = null;
        switch(triggerSchema.type) {
            case TriggerType.SWITCH: {
                trigger = this.getSwitchTrigger(triggerSchema.switchId, triggerSchema.holdIntervalMs);
                if (!trigger) {
                    trigger = SwitchActionTrigger.fromJSON(triggerSchema);
                    this.triggers.push(trigger);
                }
                break;
            }
            case TriggerType.ID: {
                trigger = this.getTrigger(triggerSchema.id);
                if (!trigger) {
                    trigger = IdActionTrigger.fromJSON(triggerSchema);
                    this.triggers.push(trigger);
                }
                break;
            }
        }

        // Second, create this triggers actions.
        let newAction: Action = null;
        for (const actionSchema of triggerSchema.actions) {
            switch (actionSchema.type) {
                case ActionType.DATA:
                    newAction = DataAction.fromJSON(actionSchema);
                    break;
                case ActionType.DEVICE:
                    newAction = new DeviceAction(
                        DesiredOutputState.constructFromOutputState(actionSchema.state)
                    );
                    break;
                case ActionType.STATE: {
                    newAction = StateAction.fromJSON(actionSchema);
                    break;
                }
                case ActionType.CONDITION:
                    newAction = ConditionalAction.fromJSON(actionSchema);
                    break;
                default:
                    throw new Error('Not implemented');
            }

            trigger.actions.push(newAction);

            newAction.onDirty(() => {
                this.emitDirty();
            });
        }
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

    public onSwitch(id: string): boolean {
        return this.activateTrigger(id, TriggerType.SWITCH);
    }

    public onTrigger(id: string): boolean {
        return this.activateTrigger(id, TriggerType.ID);
    }

    private activateTrigger(id: string, type: TriggerType): boolean {
        const childHandled = this.getActiveChildren()
            .map((child) => child.activateTrigger(id, type))
            .reduce((accum, curv) => {
                return accum || curv;
            }, false);

        if (childHandled) {
            return true;
        }

        let matchingTrigger: ActionTriggerType = null;
        switch(type) {
            case TriggerType.SWITCH:
                matchingTrigger = this.getSwitchTrigger(id);
            break;
            case TriggerType.ID:
                matchingTrigger = this.getTrigger(id);
            break;
        }

        if (matchingTrigger) {
            for(const action of matchingTrigger.actions) {
                action.handle(
                    RuleEngine.root,
                    this.getInheritedData(), this.getDevices()
                );
            }
            return true;
        }
        else {
            return false;
        }
    }

    getSwitchTrigger(switchId: string, holdIntervalMs?: number): ActionTriggerType {
        return this.getSwitchTriggers()
            .find((trigger: SwitchActionTrigger) =>
                trigger.type === TriggerType.SWITCH &&
                trigger.switchId === switchId &&
                trigger.holdIntervalMs == holdIntervalMs
            );
    }

    public getHoldSwitchTriggers(): SwitchActionTrigger[] {
        return this.getSwitchTriggers()
            .filter((trigger) => trigger.holdIntervalMs > 0);
    }

    public getSwitchTriggers(): SwitchActionTrigger[] {
        return this.triggers
            .filter((trigger) => trigger.type === TriggerType.SWITCH) as SwitchActionTrigger[];
    }

    getTrigger(triggerId: string): ActionTriggerType {
        return this.triggers
            .filter((trigger) => trigger.type === TriggerType.ID)
            .find((trigger: IdActionTrigger) => trigger.id === triggerId);
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

    public getInheritedData(): Map<string, RuleData> {
        const parentData = this.parent ? this.parent.getInheritedData() : new Map<string, RuleData>();

        // apply our data over our parents
        for(const d of this.data) {
            parentData.set(d[0], d[1]);
        }

        return parentData;
    }

    toJSON() {
        return {
            id: this.id,
            autostart: this.autoStart,
            metadata: {
                name: this.name,
                description: this.description
            },
            children: this.children,
            triggers: this.triggers,
            devices: Array.from(this.devices.values()),
            data: Array.from(this.data.values()).map((d) => {
                return {id: d.id, value: d.initValue};
            })
        };
    }
}