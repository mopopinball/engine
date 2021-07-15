import { PlayfieldSwitch } from "../devices/playfield-switch";
import { DirtyNotifier } from "../dirty-notifier";
import { logger } from "../logger";
import { Action } from "./actions/action";
import { ActionTriggerType } from "./actions/trigger";
import { DeviceAction } from "./actions/device-action";
import { IdTrigger } from "./actions/id-trigger";
import { SwitchTrigger } from "./actions/switch-trigger";
import { TimerTrigger } from "./actions/timer-trigger";
import { DesiredOutputState } from "./desired-output-state";
import { DataItem, NumberData } from "./rule-data";
import { DataSchemaType, RuleSchema } from "./schema/rule.schema";
import { TriggerSchemasType, TriggerType } from "./schema/triggers.schema";
import { ActionFactory } from "./actions/action-factory";

export class RuleEngine extends DirtyNotifier {
    static root: RuleEngine;
    static switchesById: Map<string, PlayfieldSwitch>;
    active = false;
    name: string;
    description: string;
    data: Map<string, DataItem> = new Map();
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
                engine.data.set(data.id, this.fromJsonData(data));
            }
        }

        return engine;
    }

    public createTrigger(triggerSchema: TriggerSchemasType): void {
        // First, find or create the incoming trigger.
        let trigger: ActionTriggerType = null;
        switch(triggerSchema.type) {
            case TriggerType.SWITCH: {
                trigger = this.getSwitchTrigger(triggerSchema.switchId, triggerSchema.holdIntervalMs);
                if (!trigger) {
                    trigger = SwitchTrigger.fromJSON(triggerSchema);
                    this.triggers.push(trigger);
                }
                break;
            }
            case TriggerType.ID: {
                trigger = this.getTrigger(triggerSchema.id);
                if (!trigger) {
                    trigger = IdTrigger.fromJSON(triggerSchema);
                    this.triggers.push(trigger);
                }
                break;
            }
            case TriggerType.TIMER: {
                trigger = this.getTrigger(triggerSchema.id);
                if (!trigger) {
                    trigger = TimerTrigger.fromJSON(triggerSchema);
                    this.triggers.push(trigger);
                }
                break;
            }
            default:
                logger.warn('Unexpected trigger type.');
        }

        // Second, create this triggers actions.
        let newAction: Action = null;
        for (const actionSchema of triggerSchema.actions) {
            newAction = ActionFactory.create(actionSchema);

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
            .forEach((t: TimerTrigger) => t.start());
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
            .forEach((t: TimerTrigger) => t.stop());

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
            .find((trigger: SwitchTrigger) =>
                trigger.switchId === switchId &&
                trigger.holdIntervalMs == holdIntervalMs
            );
    }

    public getAllHoldSwitchTriggers(): SwitchTrigger[] {
        let holdSws: SwitchTrigger[] = this.getSwitchTriggers()
            .filter((trigger) => trigger.holdIntervalMs > 0);

        for(const c of this.children) {
            const childs = c.getAllHoldSwitchTriggers();
            holdSws = holdSws.concat(childs);
        }
        return holdSws;
    }

    public getSwitchTriggers(): SwitchTrigger[] {
        return this.triggers
            .filter((trigger) => trigger.type === TriggerType.SWITCH) as SwitchTrigger[];
    }

    getTrigger(triggerId: string): ActionTriggerType {
        return this.triggers
            .filter((trigger) => trigger.type === TriggerType.ID || trigger.type === TriggerType.TIMER)
            .find((trigger: IdTrigger) => trigger.id === triggerId);
    }

    // compressed data.
    getData(parentData: Map<string, DataItem> = new Map()): Map<string, DataItem> {
        let newData: Map<string, DataItem> = new Map();
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

    public getInheritedData(): Map<string, DataItem> {
        const parentData = this.parent ? this.parent.getInheritedData() : new Map<string, NumberData>();

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

    getAllTimerTriggers(): TimerTrigger[] {
        let timerTriggers: TimerTrigger[] = this.getTimerTriggers();
        
        for(const c of this.children) {
            timerTriggers = timerTriggers.concat(c.getAllTimerTriggers());
        }
        
        return timerTriggers;
    }

    private getTimerTriggers(): TimerTrigger[] {
        return this.triggers
            .filter((t) => t.type === TriggerType.TIMER) as TimerTrigger[];
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
            data: Array.from(this.data.values()).map((d) => this.toJsonData(d))
        };
    }

    private toJsonData(d: DataItem): DataSchemaType {
        switch(d.type) {
            case 'number':
                return {
                    type: 'number',
                    id: d.id,
                    value: d.initValue,
                    attributes: {
                        isWholeNumber: d.attributes?.isWholeNumber,
                        resetOnStateStop: d.attributes?.resetOnStateStop
                    }
                };
            case 'string':
                return {
                    type: 'string',
                    id: d.id,
                    value: d.initValue,
                    attributes: {
                        resetOnStateStop: d.attributes?.resetOnStateStop
                    }
                }
            default:
                throw new Error('Could not serialize');
        }
    }

    private static fromJsonData(data: DataSchemaType): DataItem {
        switch(data.type) {
            case 'number':
            default: // handle backwards compat.
                return {
                    type: 'number',
                    id: data.id,
                    value: data.value,
                    initValue: data.value,
                    attributes: data.attributes
                };
            case 'string':
                return {
                    type: 'string',
                    id: data.id,
                    value: data.value,
                    initValue: data.value,
                    attributes: data.attributes
                };
        }
    }
}