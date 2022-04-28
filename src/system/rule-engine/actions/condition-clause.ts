import { logger } from "../../logger";
import { ConditionalActionConditionSchema, ConditionalClauseSchema } from "../schema/actions.schema";

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

export interface ConditionResult {
    triggerId?: string;
}

export type Condition = DataCondition | SwitchCondition;


export class ConditionClause {
    constructor(
        public conditions: Condition[],
        public trueResult: ConditionResult) {}

    toJSON(): ConditionalClauseSchema {
        return {
            conditions: this.conditions.map((c) => this.toConditionJson(c)),
            trueResult: {triggerId: this.trueResult.triggerId}
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

    static fromJSON(clauseSchema: ConditionalClauseSchema): ConditionClause {
        return new ConditionClause(
            clauseSchema.conditions.map((c): Condition => this.createCondition(c)),
            {triggerId: clauseSchema.trueResult.triggerId}
        );
    }

    public static createCondition(c: ConditionalActionConditionSchema): Condition {
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
}