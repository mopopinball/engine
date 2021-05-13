import { DataEvaluator } from "../../data-evaluator";
import { logger } from "../../logger";
import { ActionType, ConditionalActionConditionSchema, ConditionalActionSchema } from "../schema/actions.schema";
import { Action } from "./action";

export type Operator = '>' | '<' | '<=' | '>=' | '===' | '!=';

export interface DataCondition {
    conditionType: 'data';
    dataId?: string;
    operator?: Operator;
    operand?: number;
    expression?: string;
}

export interface SwitchCondition {
    conditionType: 'switch';
    switchId: string;
    activated: boolean;
}

export type Condition = DataCondition | SwitchCondition;

export class ConditionalAction extends Action {
    constructor(
        public conditions: Condition[], public trueTriggerId: string, public falseTriggerId: string
    ) {
        super(ActionType.CONDITION);
    }
    
    onAction(): void {
        // determine if the action is satasified.
        const areConditionsSatasified = this.conditions.every((condition) => {
            switch(condition.conditionType) {
                case 'data':
                    return this.onData(condition);
                    break;
                case 'switch':
                    return this.onSwitch(condition);
                default:
                    logger.warn(`Cannot process condition type.`);
            }
        });

        if (areConditionsSatasified && this.trueTriggerId) {
            this.rootEngine.onTrigger(this.trueTriggerId);
        } else if (this.falseTriggerId) {
            this.rootEngine.onTrigger(this.falseTriggerId);
        }
    }

    onData(dataCondition: DataCondition): boolean {
        const expression = this.getDataExpression(dataCondition);
        const result = DataEvaluator.evaluateBoolean(expression);
        logger.debug(`[Conditional Data Action] Evaluating "${expression}". Result = ${result}`);
        return result;
    }

    private getDataExpression(dataCondition: DataCondition): string {
        if (dataCondition.expression) {
            return dataCondition.expression;
        }
        else {
            const d = this.data.get(dataCondition.dataId);
            return `${d.value} ${dataCondition.operator} ${dataCondition.operand}`;
        }
    }

    onSwitch(switchCondition: SwitchCondition): boolean {
        logger.debug(`[Conditional Switch Action] Evaluating ${switchCondition.switchId} is ${switchCondition.activated}`);
        return this.rootEngine.isSwitchInState(switchCondition.switchId, switchCondition.activated);
    }

    static fromJSON(actionSchema: ConditionalActionSchema): ConditionalAction {
        const conditions: Condition[] = actionSchema.condition instanceof Array ?
        actionSchema.condition.map((c): Condition => this.createCondition(c)) :
            [this.createCondition(actionSchema.condition)];
        return new ConditionalAction(
            conditions,
            actionSchema.trueTriggerId,
            actionSchema.falseTriggerId
        );
    }

    private static createCondition(c: ConditionalActionConditionSchema): Condition {
        switch (c.conditionType) {
            case 'data': 
                return {
                    conditionType: c.conditionType,
                    dataId: c.dataId,
                    operator: c.operator,
                    operand: c.operand,
                    expression: c.expression
                };
            case 'switch':
                return {
                    conditionType: c.conditionType,
                    switchId: c.switchId,
                    activated: c.activated,
                };
            default:
                logger.warn(`Unexpected condition type, skipping.`);
        }
        
    }

    toJSON(): ConditionalActionSchema {
        return {
            type: ActionType.CONDITION,
            condition: this.conditions.map((c) => this.toConditionJson(c)),
            trueTriggerId: this.trueTriggerId,
            falseTriggerId: this.falseTriggerId
        };
    }

    private toConditionJson(condition: Condition): ConditionalActionConditionSchema {
        switch (condition.conditionType) {
            case 'data':
                return {
                    conditionType: 'data',
                    dataId: condition.dataId,
                    operator: condition.operator,
                    operand: condition.operand,
                    expression: condition.expression
                };
            case 'switch':
                return {
                    conditionType: 'switch',
                    switchId: condition.switchId,
                    activated: condition.activated
                };
            default:
                logger.warn('Cannot serialized condition.');
        }
    }

    toString(): string {
        return `Conditional actions: ${this.conditions.map((c) => c.conditionType).join(', ')}`;   
    }

}