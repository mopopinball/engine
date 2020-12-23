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
        if (this.operation === DataOperation.INCREMENT) {
            this.getData().value += this.operand; 
        } else if (this.operation === DataOperation.DECREMENT) {
            this.getData().value -= this.operand; 
        } else if (this.operation === DataOperation.ASSIGN) {
            this.getData().value = this.operand; 
        }
    }

    private getData(): RuleData {
        return this.data.get(this.dataKey);
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
    DECREMENT,
    ASSIGN
}