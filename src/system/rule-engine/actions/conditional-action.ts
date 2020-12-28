import { DesiredOutputState } from "../desired-output-state";
import { RuleData } from "../rule-data";
import { RuleEngine } from "../rule-engine";
import { ActionType, ConditionalActionSchema, DataActionSchema } from "../schema/rule.schema";
import { Action } from "./action";

export type Operator = '>' | '<' | '<=' | '>=' | '===' | '!=';

export type DataCondition = {
    conditionType: 'data',
    dataId: string,
    operator: Operator,
    operand: number
}

export type Condition = DataCondition;

export class ConditionalAction extends Action {
    constructor(
        private condition: Condition, private trueTriggerId: string, private falseTriggerId: string
    ) {
        super();
    }
    
    onAction(): void {
        let result: boolean;
        switch(this.condition.conditionType) {
            case 'data':
                result = this.onData(this.condition);
                break;
        }

        if (result && this.trueTriggerId) {
            this.rootEngine.onTrigger(this.trueTriggerId);
        } else if (this.falseTriggerId) {
            this.rootEngine.onTrigger(this.falseTriggerId);
        }
    }

    onData(dataCondition: DataCondition): boolean {
        const d = this.data.get(dataCondition.dataId);
        switch(dataCondition.operator) {
            case '>':
                return d.value > dataCondition.operand;
            case '<':
                return d.value < dataCondition.operand;
            case '<=':
                return d.value <= dataCondition.operand;
            case '>=':
                return d.value >= dataCondition.operand;
            case '===':
                return d.value === dataCondition.operand;
            case '!=':
                return d.value != dataCondition.operand;
            default:
                throw new Error('not impl');
        }
    }

    static fromJSON(actionSchema: ConditionalActionSchema): ConditionalAction {
        return new ConditionalAction(
            {
                conditionType: actionSchema.condition.conditionType,
                dataId: actionSchema.condition.dataId,
                operator: actionSchema.condition.operator,
                operand: actionSchema.condition.operand
            },
            actionSchema.trueTriggerId,
            actionSchema.falseTriggerId
        );
    }

    toJSON(): ConditionalActionSchema {
        return {
            type: ActionType.CONDITION,
            condition: {
                conditionType: this.condition.conditionType,
                dataId: this.condition.dataId,
                operator: this.condition.operator,
                operand: this.condition.operand
            },
            trueTriggerId: this.trueTriggerId,
            falseTriggerId: this.falseTriggerId
        };
    }

}