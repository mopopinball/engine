import { DirtyNotifier } from "../../dirty-notifier";
import { DesiredOutputState } from "../desired-output-state";
import { DataItem } from "../rule-data";
import { RuleEngine } from "../rule-engine";
import { ActionSchemaType, ActionType } from "../schema/actions.schema";
import { DesignerAttributes } from "./designer-attributes";

export abstract class Action extends DirtyNotifier {
    protected rootEngine: RuleEngine;
    protected data: Map<string, DataItem>;
    protected devices: Map<string, DesiredOutputState>;
    public designer: DesignerAttributes;
    
    constructor(public readonly type: ActionType) {
        super();
    }

    abstract onAction(): void;

    handle(rootEngine: RuleEngine, data: Map<string, DataItem>, devices: Map<string, DesiredOutputState>): void {
        this.rootEngine = rootEngine;
        this.data = data;
        this.devices = devices;

        this.onAction();
        this.emitDirty();
    }

    protected getEngines(): Map<string, RuleEngine> {
        return this.rootEngine?.getAllEngines() ?? new Map();
    }
    
    public abstract toJSON(): ActionSchemaType;

    public abstract toString(): string;
}