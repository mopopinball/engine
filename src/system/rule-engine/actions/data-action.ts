import { RuleData } from "../rule-data";
import { ActionType, DataActionSchema } from "../schema/rule.schema";
import { Action } from "./action";

export class DataAction extends Action {
    constructor(public readonly dataKey: string, public operation: DataOperation, public operand: number
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

    public static fromJSON(actionSchema: DataActionSchema): DataAction {
        return new DataAction(
            actionSchema.dataId, 
            actionSchema.operation, 
            actionSchema.operand
        );
    }

    toJSON(): DataActionSchema {
        return {
            type: ActionType.DATA,
            dataId: this.dataKey,
            operation: this.operation,
            operand: this.operand
        }
    }
}

export enum DataOperation {
    INCREMENT,
    DECREMENT,
    ASSIGN
}