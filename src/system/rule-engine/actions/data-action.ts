import { DesiredOutputState } from "../desired-output-state";
import { RuleData } from "../rule-data";
import { RuleEngine } from "../rule-engine";
import { Action } from "./action";

export class DataAction extends Action {
    constructor(id: string, private dataKey: string, private operation: DataOperation, private operand: number, actions: Map<string, Action>,
        nextCollection: string[]) {
        super(id, actions, nextCollection);
    }
    
    onAction(engines: Map<string, RuleEngine>, data: Map<string, RuleData>, devices: Map<string, DesiredOutputState>): void { // eslint-disable-line @typescript-eslint/no-unused-vars
        // todo: operate
        if (this.operation === DataOperation.INCREMENT) {
            data.get(this.dataKey).value += this.operand; 
        }
    }
}

export enum DataOperation {
    INCREMENT,
    DECREMENT
}