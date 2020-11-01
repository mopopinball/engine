import { PlayfieldLamp } from "../../../devices/playfield-lamp";
import { DirtyNotifier } from "../../dirty-notifier";
import { RuleData } from "../rule-data";

export abstract class Action extends DirtyNotifier {
    constructor(
        public id: string, protected actions: Map<string, Action>, private nextCollection: string[] = []
    ){
        super();
    }

    abstract onAction(data: Map<string, RuleData>, devices: Map<string, PlayfieldLamp>): void;
    
    handle(data: Map<string, RuleData>, devices: Map<string, PlayfieldLamp>): void {
        this.onAction(data, devices);
        this.emitDirty();
        
        for (const a of this.nextCollection) {
            this.actions.get(a).handle(data, devices);
        }
    }
}