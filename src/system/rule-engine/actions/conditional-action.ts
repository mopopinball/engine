import { ActionType, ConditionalActionSchema } from "../schema/actions.schema";
import { Action } from "./action";
import { Condition, ConditionClause, ConditionResult } from "./condition-clause";
import { ConditionalClauseEvaluator } from "./conditional-clause-evaluator";

export class ConditionalAction extends Action {
    constructor(public clauses: ConditionClause[], public falseResult?: ConditionResult) {
        super(ActionType.CONDITION);
    }
    
    onAction(): void {
        const evaluator = new ConditionalClauseEvaluator(this.rootEngine, this.data);

        // finds the first clause which is satasified and runs its result.
        for(const clause of this.clauses) {
            const isSatisified = evaluator.isSatasified(clause);
            if (isSatisified) {
                if (clause.trueResult.triggerId) {
                    this.rootEngine.onTrigger(clause.trueResult.triggerId);
                }
                return;
            }
        }

        if (this.falseResult?.triggerId) {
            this.rootEngine.onTrigger(this.falseResult.triggerId);
        }
    }

    static fromJSON(actionSchema: ConditionalActionSchema): ConditionalAction {
        let clauses: ConditionClause[] = [];
        if (actionSchema.condition instanceof Array) { // legacy
            const conditions = actionSchema.condition.map((c): Condition => ConditionClause.createCondition(c))
            const clause: ConditionClause = new ConditionClause(conditions, {triggerId: actionSchema.trueTriggerId});
            clauses.push(clause);
        }
        else if (actionSchema.condition) { // even more legacy
            const conditions = [ConditionClause.createCondition(actionSchema.condition)];
            const clause: ConditionClause = new ConditionClause(conditions, {triggerId: actionSchema.trueTriggerId});
            clauses.push(clause);
        }
        else {
            clauses = actionSchema.clauses.map((c) => ConditionClause.fromJSON(c));
        }

        return new ConditionalAction(
            clauses,
            {triggerId: actionSchema.falseResult.triggerId}
        );
    }

    toJSON(): ConditionalActionSchema {
        return {
            type: ActionType.CONDITION,
            clauses: this.clauses.map((c) => c.toJSON()),
            falseResult: {triggerId: this.falseResult?.triggerId}
        };
    }

    toString(): string {
        return `[Conditional Action]: ${this.clauses.map((c) => c.trueResult.triggerId).join(', ')}`;   
    }
}