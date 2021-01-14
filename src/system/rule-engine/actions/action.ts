import { DirtyNotifier } from "../../dirty-notifier";
import { DesiredOutputState } from "../desired-output-state";
import { RuleData } from "../rule-data";
import { RuleEngine } from "../rule-engine";
import { ActionSchemaType } from "../schema/rule.schema";

export abstract class Action extends DirtyNotifier {
    protected rootEngine: RuleEngine;
    protected engines: Map<string, RuleEngine>;
    protected data: Map<string, RuleData>;
    protected devices: Map<string, DesiredOutputState>;
    
    constructor() {
        super();
    }

    abstract onAction(): void;

    handle(rootEngine: RuleEngine, data: Map<string, RuleData>, devices: Map<string, DesiredOutputState>): void {
        this.rootEngine = rootEngine;
        this.engines = this.rootEngine?.getAllEngines() ?? new Map();
        this.data = data;
        this.devices = devices;

        this.onAction();
        this.emitDirty();
    }
    
    public abstract toJSON(): ActionSchemaType;
}