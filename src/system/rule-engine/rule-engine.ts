import { PlayfieldSwitch } from "../devices/playfield-switch";
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
import { TimerActionTrigger } from "./actions/timer-action-trigger";
import { DesiredOutputState } from "./desired-output-state";
import { RuleData } from "./rule-data";
import { ActionType, IdActionTriggerSchema, RuleSchema, SwitchActionTriggerSchema, TimerActionTriggerSchema, TriggerType } from "./schema/rule.schema";

export class RuleEngine extends DirtyNotifier {
    static root: RuleEngine;
    static switchesById: Map<string, PlayfieldSwitch>;
    active = false;
    name: string;
    description: string;
    data: Map<string, RuleData> = new Map();
    devices: Map<string, DesiredOutputState> = new Map();
    rollbackActions: DeviceAction[] = [];
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
                engine.data.set(data.id, {
                    id: data.id,
                    value: data.value,
                    initValue: data.value,
                    attributes: data.attributes
                });
            }
        }

        return engine;
    }

    public createTrigger(triggerSchema: SwitchActionTriggerSchema | IdActionTriggerSchema | TimerActionTriggerSchema): void {
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
            case TriggerType.TIMER: {
                trigger = this.getTrigger(triggerSchema.id);
                if (!trigger) {
                    trigger = TimerActionTrigger.fromJSON(triggerSchema);
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
        logger.debug(`[Start State] ${this.id}`);
        this.devices.forEach((d) => d.reset());
        this.getTimerTriggers()
            .forEach((t: TimerActionTrigger) => t.start());
        this.children
            .filter((child) => child.autoStart)
            .map((c) => c.start());
    }

    stop(): void {
        this.active = false;
        logger.debug(`[Stop State] ${this.id}`);

        // non-instant devices which were adjusted by a device action are reset on our stop()/exit.
        this.rollbackActions.forEach((d) => d.rollback());
        this.rollbackActions = [];

        // Stop work
        // 1. Reset any data requiring reset.
        for(const d of Array.from(this.data.values())) {
            if (d.attributes?.resetOnStateStop) {
                d.value = d.initValue;
            }
        }
        // 2. Stop any running timer triggers.
        this.getTimerTriggers()
            .forEach((t: TimerActionTrigger) => t.stop());

        this.children
            .map((c) => c.stop());
    }

    public onSwitch(id: string, holdIntervalMs?: number): boolean {
        return this.activateTrigger(id, TriggerType.SWITCH, holdIntervalMs);
    }

    public onTrigger(id: string): boolean {
        return this.activateTrigger(id, TriggerType.ID);
    }

    // TODO: Accepting holdIntervalMs here is crap. Fix?
    private activateTrigger(id: string, type: TriggerType, holdIntervalMs?: number): boolean {
        const childHandled = this.getActiveChildren()
            .map((child) => child.activateTrigger(id, type, holdIntervalMs))
            .reduce((accum, curv) => {
                return accum || curv;
            }, false);

        if (childHandled) {
            return true;
        }

        let matchingTrigger: ActionTriggerType = null;
        switch(type) {
            case TriggerType.SWITCH:
                matchingTrigger = this.getSwitchTrigger(id, holdIntervalMs);
            break;
            case TriggerType.ID:
                matchingTrigger = this.getTrigger(id);
            break;
        }

        if (matchingTrigger) {
            logger.debug(`[Handle Trigger] ${matchingTrigger.toString()}`);
            for(const action of matchingTrigger.actions) {
                logger.debug(`[Handle Action] ${action.toString()}`)
                action.handle(
                    RuleEngine.root,
                    this.getInheritedData(),
                    this.getInheritedDevices()
                );
                if (action instanceof DeviceAction && action.requiresRollback()) {
                    this.rollbackActions.push(action);
                }
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
                trigger.switchId === switchId &&
                trigger.holdIntervalMs == holdIntervalMs
            );
    }

    public getAllHoldSwitchTriggers(): SwitchActionTrigger[] {
        let holdSws: SwitchActionTrigger[] = this.getSwitchTriggers()
            .filter((trigger) => trigger.holdIntervalMs > 0);

        for(const c of this.children) {
            const childs = c.getAllHoldSwitchTriggers();
            holdSws = holdSws.concat(childs);
        }
        return holdSws;
    }

    public getSwitchTriggers(): SwitchActionTrigger[] {
        return this.triggers
            .filter((trigger) => trigger.type === TriggerType.SWITCH) as SwitchActionTrigger[];
    }

    getTrigger(triggerId: string): ActionTriggerType {
        return this.triggers
            .filter((trigger) => trigger.type === TriggerType.ID || trigger.type === TriggerType.TIMER)
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

    public getInheritedDevices(): Map<string, DesiredOutputState> {
        const parentDevices = this.parent ? this.parent.getInheritedDevices() : new Map<string, DesiredOutputState>();

        // apply our desired output state over our parents
        for(const d of this.devices) {
            parentDevices.set(d[0], d[1]);
        }

        return parentDevices;
    }

    getAllStateNames(names = new Set<string>()): Set<string> {
        names.add(this.id);
        
        for(const c of this.children) {
            c.getAllStateNames(names);
        }

        return names;
    }

    getAllTimerTriggers(): TimerActionTrigger[] {
        let timerTriggers: TimerActionTrigger[] = this.getTimerTriggers();
        
        for(const c of this.children) {
            timerTriggers = timerTriggers.concat(c.getAllTimerTriggers());
        }
        
        return timerTriggers;
    }

    private getTimerTriggers(): TimerActionTrigger[] {
        return this.triggers
            .filter((t) => t.type === TriggerType.TIMER) as TimerActionTrigger[];
    }

    isSwitchInState(switchId: string, activated: boolean): boolean {
        const sw = RuleEngine.switchesById.get(switchId);
        if (sw) {
            return sw.getActive() === activated;
        }
        else {
            return false;
        }
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
                return {
                    id: d.id,
                    value: d.initValue,
                    attributes: {
                        isWholeNumber: d.attributes?.isWholeNumber,
                        resetOnStateStop: d.attributes?.resetOnStateStop
                    }
                };
            })
        };
    }
}