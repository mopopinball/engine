import { DirtyNotifier } from "../../dirty-notifier";
import { DesiredOutputState } from "../desired-output-state";
import { RuleData } from "../rule-data";
import { RuleEngine } from "../rule-engine";
import { ActionTriggerType } from "./switch-action-trigger";

export abstract class Action extends DirtyNotifier {
    protected engines: Map<string, RuleEngine>;
    protected data: Map<string, RuleData>;
    protected devices: Map<string, DesiredOutputState>;
    
    constructor() {
        super();
    }

    abstract onAction(): void;
    
    handle(engines: Map<string, RuleEngine>, data: Map<string, RuleData>, devices: Map<string, DesiredOutputState>): void {
        this.engines = engines;
        this.data = data;
        this.devices = devices;

        this.onAction();
        this.emitDirty();
        
        // for (const a of this.nextCollection) {
        //     this.actions.get(a).handle(engines, data, devices);
        // }
    }
}