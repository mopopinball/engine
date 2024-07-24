import { ActionType, RandomActionSchema} from "../schema/actions.schema";
import { Action } from "./action";
import { ConditionClause } from "./condition-clause";
import { ConditionalClauseEvaluator } from "./conditional-clause-evaluator";

export interface RandomActionCandidate {
    clause: ConditionClause;
    weight?: number;
    derivedWeight?: number;
}

/**
 * Considers a list of candidates and of those who's clauses are all true, randomally chooses one.
 */
export class RandomAction extends Action {
    constructor(public candidates: RandomActionCandidate[]) {
        super(ActionType.RANDOM);

        this.updateWeights();
    }

    private updateWeights(): void {
        let providedSum = 0;
        this.candidates
            .filter((c) => c.weight > 0)
            .forEach((c) => providedSum = providedSum + c.weight);
        const unweightedItems = this.candidates
            .filter((c) => !c.weight);
        for(const uwi of unweightedItems) {
            uwi.derivedWeight = (1 - providedSum) / unweightedItems.length;
        }
    }

    onAction(): void {
        // first determine which candidate's clauses are all true.
        const evaluator = new ConditionalClauseEvaluator(this.rootEngine, this.data);
        const satasifiedCandidates = this.candidates.filter((c) => evaluator.isSatasified(c.clause));

        // now of these candidates, do the random choosing.
        let weightSum = 0;
        const rand = Math.random();
        for(const candidate of satasifiedCandidates) {
            weightSum += candidate.weight || candidate.derivedWeight;
            if (rand < weightSum) {
                this.rootEngine.onTrigger(candidate.clause.trueResult.triggerId);
            }
        }
    }

    static fromJSON(actionSchema: RandomActionSchema): RandomAction {
        const action = new RandomAction(
            actionSchema.candidates.map((c) => {
                return {
                    clause: ConditionClause.fromJSON(c.clause),
                    weight: c.weight
                };
            })
        );
        action.designer = actionSchema.designer;
        return action;
    }

    public toJSON(): RandomActionSchema {
        return {
            type: ActionType.RANDOM,
            candidates: this.candidates.map((c) => {
                return {
                    clause: c.clause.toJSON(),
                    weight: c.weight
                }
            }),
            designer: this.designer
        };
    }

    toString(): string {
        return `Random action: todo`;   
    }
}