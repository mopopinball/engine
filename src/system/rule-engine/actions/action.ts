import { PlayfieldLamp } from "../../../devices/playfield-lamp";
import { RuleData } from "../rule-data";

export abstract class Action {
    
    constructor(
        public id: string, protected actions: Map<string, Action>, private nextCollection: string[] = []
    ){}

    abstract onAction(data: Map<string, RuleData>, devices: Map<string, PlayfieldLamp>): void;
    
    handle(data: Map<string, RuleData>, devices: Map<string, PlayfieldLamp>): void {
        this.onAction(data, devices);
        
        for (const a of this.nextCollection) {
            this.actions.get(a).handle(data, devices);
        }
    }
}