import { RuleData } from "../rule-data";
import { ActionType, DataActionSchema } from "../schema/rule.schema";
import { Action } from "./action";

export class DataAction extends Action {
    constructor(
        public readonly dataKey: string, public operation: DataOperation, public operand: number | string
    ) {
        super();
    }
    
    onAction(): void {
        const currentOperand: number = typeof this.operand === 'number' ?
            this.operand :
            this.getData(this.operand).value;

        if (this.operation === DataOperation.INCREMENT) {
            this.getData().value += currentOperand; 
        } else if (this.operation === DataOperation.DECREMENT) {
            this.getData().value -= currentOperand;
            if (this.getData().attributes?.isWholeNumber && this.getData().value < 0) {
                this.getData().value = 0;
            }
        } else if (this.operation === DataOperation.ASSIGN) {
            this.getData().value = currentOperand; 
        }
    }

    private getData(dataKey: string = this.dataKey): RuleData {
        return this.data.get(dataKey);
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