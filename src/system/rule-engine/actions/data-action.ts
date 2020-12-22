import { DesiredOutputState } from "../desired-output-state";
import { RuleData } from "../rule-data";
import { RuleEngine } from "../rule-engine";
import { ActionType, DataActionSchema } from "../schema/rule.schema";
import { Action } from "./action";

export class DataAction extends Action {
    constructor(private dataKey: string, private operation: DataOperation, private operand: number
    ) {
        super();
    }
    
    onAction(): void {
        // todo: operate
        if (this.operation === DataOperation.INCREMENT) {
            this.data.get(this.dataKey).value += this.operand; 
        }
    }

    toJSON(): DataActionSchema {
        return {
            type: ActionType.DATA,
            dataId: null,
            operation: null,
            operand: null // todo all these
        }
    }
}

export enum DataOperation {
    INCREMENT,
    DECREMENT
}