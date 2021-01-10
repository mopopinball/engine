import { DataEvaluator } from "../../data-evaluator";
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
            DataEvaluator.evaluate(this.operand, this.data);

        switch(this.operation) {
            case DataOperation.INCREMENT:
                this.getData().value += currentOperand; 
                break;
            case DataOperation.DECREMENT:
                this.getData().value -= currentOperand;
                if (this.getData().attributes?.isWholeNumber && this.getData().value < 0) {
                    this.getData().value = 0;
                }
                break;
            case DataOperation.ASSIGN:
                this.getData().value = currentOperand;
                break;
            case DataOperation.MULTIPLY:
                this.getData().value *= currentOperand;
                break;
            case DataOperation.DIVIDE:
                this.getData().value /= currentOperand;
                break;
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
    MULTIPLY,
    DIVIDE,
    ASSIGN
}