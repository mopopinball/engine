import { RuleEngine } from "../rule-engine";
import { logger } from "../../logger";
import { DataEvaluator } from "../../data-evaluator";
import { DataItem } from "../rule-data";
import { Condition, ConditionClause, DataCondition, SwitchCondition } from "./condition-clause";

export class ConditionalClausEvaluator {
    constructor(private rootEngine: RuleEngine, private data: Map<string, DataItem>) {}
    
    public isSatasified(clause: ConditionClause): boolean {
        const isSatisified = this.evaluateConditions(clause.conditions);
        return isSatisified;
    }

    private evaluateConditions(conditions: Condition[]): boolean {
        // determine if the action is satasified by ANDing every condition.
        const areConditionsSatasified = conditions.every((condition) => {
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
        return areConditionsSatasified;
    }

    private onData(dataCondition: DataCondition): boolean {
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

    private onSwitch(switchCondition: SwitchCondition): boolean {
        logger.debug(`[Conditional Switch Action] Evaluating ${switchCondition.switchId} is ${switchCondition.activated}`);
        return this.rootEngine.isSwitchInState(switchCondition.switchId, switchCondition.activated);
    }
}