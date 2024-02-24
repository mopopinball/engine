import { RuleEngine } from "../rule-engine";
import { logger } from "../../logger";
import { DataEvaluator } from "../../data-evaluator";
import { DataItem, NumberData } from "../rule-data";
import { Condition, ConditionClause, DataCondition, SwitchCondition } from "./condition-clause";

export class ConditionalClauseEvaluator {
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
        logger.debug(`[Conditional Clauses] evaluating ${conditions.length} conditions. Satisfied = ${areConditionsSatasified}`);
        return areConditionsSatasified;
    }

    private onData(dataCondition: DataCondition): boolean {
        const expression = this.getDataExpression(dataCondition);
        // rely on data being numbers
        const result = DataEvaluator.evaluateBoolean(expression, this.data as Map<string, NumberData>);
        logger.debug(`[Data Condition] evaluated to ${result}`);
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
        const isSwitchInDesiredState = this.rootEngine.isSwitchInState(switchCondition.switchId, switchCondition.activated);
        logger.debug(`[Switch Condition] evaluating if ${switchCondition.switchId} is ${switchCondition.activated} = ${isSwitchInDesiredState}`);
        return isSwitchInDesiredState;
    }
}