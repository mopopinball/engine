import { Coil } from "../../../devices/coil";
import { PlayfieldLamp } from "../../../devices/playfield-lamp";
import { Sound } from "../../../devices/sound";
import { DirtyNotifier } from "../../dirty-notifier";
import { DesiredOutputState } from "../desired-output-state";
import { RuleData } from "../rule-data";
import { RuleEngine } from "../rule-engine";

export abstract class Action extends DirtyNotifier {
    constructor(
        public id: string, protected actions: Map<string, Action>, private nextCollection: string[] = []
    ){
        super();
    }

    abstract onAction(engines: Map<string, RuleEngine>, data: Map<string, RuleData>, devices: Map<string, DesiredOutputState>): void;
    
    handle(engines: Map<string, RuleEngine>, data: Map<string, RuleData>, devices: Map<string, DesiredOutputState>): void {
        this.onAction(engines, data, devices);
        this.emitDirty();
        
        for (const a of this.nextCollection) {
            this.actions.get(a).handle(engines, data, devices);
        }
    }
}