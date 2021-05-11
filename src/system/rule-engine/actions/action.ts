import { DirtyNotifier } from "../../dirty-notifier";
import { DesiredOutputState } from "../desired-output-state";
import { DataItem, NumberData } from "../rule-data";
import { RuleEngine } from "../rule-engine";
import { ActionSchemaType } from "../schema/actions.schema";

export abstract class Action extends DirtyNotifier {
    protected rootEngine: RuleEngine;
    protected engines: Map<string, RuleEngine>;
    protected data: Map<string, DataItem>;
    protected devices: Map<string, DesiredOutputState>;
    
    constructor() {
        super();
    }

    abstract onAction(): void;

    handle(rootEngine: RuleEngine, data: Map<string, DataItem>, devices: Map<string, DesiredOutputState>): void {
        this.rootEngine = rootEngine;
        this.engines = this.rootEngine?.getAllEngines() ?? new Map();
        this.data = data;
        this.devices = devices;

        this.onAction();
        this.emitDirty();
    }
    
    public abstract toJSON(): ActionSchemaType;

    public abstract toString(): string;
}