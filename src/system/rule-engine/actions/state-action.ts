import { PlayfieldLamp } from "../../../devices/playfield-lamp";
import { RuleData } from "../rule-data";
import { RuleEngine } from "../rule-engine";
import { Action } from "./action";

export class StateAction extends Action {
    constructor(id: string, private child: RuleEngine, private state: boolean, actions: Map<string, Action>,
        nextCollection: string[]) {
        super(id, actions, nextCollection);
    }
    
    onAction(data: Map<string, RuleData>, devices: Map<string, PlayfieldLamp>): void {
        if (this.state) {
            this.child.start();
        }
        else {
            this.child.stop();
        }
    }

}