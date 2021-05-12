import { DataEvaluator } from "../../data-evaluator";
import { logger } from "../../logger";
import { NumberData } from "../rule-data";
import { ActionType, DataActionSchema } from "../schema/actions.schema";
import { Action } from "./action";

export class DataAction extends Action {
    constructor(
        public readonly dataKey: string, public operation: DataOperation, public operand: number | string
    ) {
        super(ActionType.DATA);
    }
    
    onAction(): void {
        // Note: We rely here on a config which contains a operand who's value only references NubmerData. If this is not true,
        // DataEvaluator.evaluate will fail because it will try to evaluate a non-numeric expression.
        const currentOperand: number = typeof this.operand === 'number' ?
            this.operand :
            DataEvaluator.evaluate(this.operand, this.data as Map<string, NumberData>);

        logger.debug(`[Data Action] Evaluating ${currentOperand} ${this.operation} ${this.getData().value}`);

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

    private getData(dataKey: string = this.dataKey): NumberData {
        return this.data.get(dataKey) as NumberData;
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

    toString(): string {
        return `Data action: ${this.dataKey} ${this.operation} ${this.operation}`;   
    }
}

export enum DataOperation {
    INCREMENT,
    DECREMENT,
    MULTIPLY,
    DIVIDE,
    ASSIGN
}