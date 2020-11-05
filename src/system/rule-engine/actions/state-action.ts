import { DesiredOutputState } from "../desired-output-state";
import { RuleData } from "../rule-data";
import { RuleEngine } from "../rule-engine";
import { Action } from "./action";

export class StateAction extends Action {
    constructor(id: string, private startTargetId: string, private stopTargetId: string, actions: Map<string, Action>,
        nextCollection: string[]) {
        super(id, actions, nextCollection);
    }
    
    onAction(engines: Map<string, RuleEngine>, data: Map<string, RuleData>, devices: Map<string, DesiredOutputState>): void { // eslint-disable-line @typescript-eslint/no-unused-vars
        if (this.startTargetId) {
            engines.get(this.startTargetId).start();
        }
        if (this.stopTargetId) {
            engines.get(this.stopTargetId).stop();
        }
    }

}