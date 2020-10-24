import { PlayfieldLamp2 } from "../../playfieldLamp2";
import { RuleData } from "../rule-data";
import { RuleEngine } from "../rule-engine";
import { Action } from "./action";

export class StateAction implements Action {
    constructor(private child: RuleEngine, private state: boolean) {}
    
    handle(data: Map<string, RuleData>, devices: Map<string, PlayfieldLamp2>): void {
        if (this.state) {
            this.child.start();
        }
        else {
            this.child.stop();
        }
    }

}