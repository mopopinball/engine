import { Switch } from "../devices/switch";
import { DirtyNotifier } from "../dirty-notifier";
import { logger } from "../logger";
import { Action } from "./actions/action";
import { ConditionalAction } from "./actions/conditional-action";
import { DataAction } from "./actions/data-action";
import { DeviceAction } from "./actions/device-action";
import { StateAction } from "./actions/state-action";
import { ActionTriggerType, SwitchActionTrigger } from "./actions/switch-action-trigger";
import { DesiredOutputState } from "./desired-output-state";
import { RuleData } from "./rule-data";
import { ActionType, ConditionalActionSchema, DataActionSchema, DeviceActionSchema, RuleSchema, StateActionSchema, SwitchActionTriggerSchema, TriggerType } from "./schema/rule.schema";

export class RuleEngine extends DirtyNotifier {
    static root: RuleEngine;
    active = false;
    name: string;
    description: string;
    data: Map<string, RuleData> = new Map();
    devices: Map<string, DesiredOutputState> = new Map();
    triggers: ActionTriggerType[] = [];
    children: RuleEngine[] = [];

    constructor(public id: string, public autoStart: boolean) {
        super();
        if (this.id === 'root') {
            RuleEngine.root = this;
        }
    }

    static load(schema: RuleSchema): RuleEngine {
        const engine = new RuleEngine(schema.id, schema.autostart);
        engine.name = schema.metadata?.name;
        engine.description = schema.metadata?.description;
        engine.children = schema.children?.map((c) => RuleEngine.load(c)) ?? [];
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
                    engine.createAction(trigger);
                }
                catch(e) {
                    // logger.error(e);                    
                }
            }
        }

        if (schema.data) {
            for (const data of schema.data) {
                engine.data.set(data.id, {id: data.id, value: data.value });
            }
        }

        return engine;
    }

    public createAction(triggerSchema: SwitchActionTriggerSchema): void {
        let newAction: Action = null;

        let trigger: SwitchActionTrigger = null;
        switch(triggerSchema.type) {
            case TriggerType.SWITCH: {
                trigger = this.getSwitchTrigger(triggerSchema.switchId, triggerSchema.holdIntervalMs);
                if (!trigger) {
                    trigger = new SwitchActionTrigger(triggerSchema.switchId, triggerSchema.holdIntervalMs);
                    this.triggers.push(trigger);
                }
                break;
            }
        }

        for (const actionSchema of triggerSchema.actions) {
            switch (actionSchema.type) {
                case ActionType.DATA:
                    newAction = new DataAction(
                        actionSchema.dataId, 
                        actionSchema.operation, 
                        actionSchema.operand
                    );
                    break;
                case ActionType.DEVICE:
                    newAction = new DeviceAction(
                        DesiredOutputState.constructFromOutputState(actionSchema.state)
                    );
                    break;
                case ActionType.STATE: {
                    newAction = new StateAction(
                            actionSchema.startTargetId,
                            actionSchema.stopTargetId
                        );
                    break;
                }
                // case ActionType.CONDITION:
                //     newAction = new ConditionalAction(
                //         actionSchema.statement,
                //         actionSchema.trueResult,
                //         actionSchema.falseResult
                //     );
                //     break;
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

    onSwitch(id: string): boolean {
        const childHandled = this.getActiveChildren()
            .map((child) => child.onSwitch(id))
            .reduce((accum, curv) => {
                return accum || curv;
            }, false);

        if (childHandled) {
            return true;
        }
        const switchTrigger = this.getSwitchTrigger(id);
        if (switchTrigger) {
            for(const action of switchTrigger.actions) {
                action.handle(RuleEngine.root.getAllEngines(), this.getData(), this.getDevices());
            }
            return true;
        }
        else {
            return false;
        }
    }

    getSwitchTrigger(switchId: string, holdIntervalMs?: number): SwitchActionTrigger {
        return this.triggers.find((trigger) =>
            trigger.type === TriggerType.SWITCH &&
            trigger.switchId === switchId &&
            trigger.holdIntervalMs == holdIntervalMs
        );
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
            id: this.id,
            autostart: this.autoStart,
            metadata: {
                name: this.name,
                description: this.description
            },
            children: this.children,
            triggers: this.triggers,
            devices: Array.from(this.devices.values())
        };
    }
}