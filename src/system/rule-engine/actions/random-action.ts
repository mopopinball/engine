import { ActionType, RandomActionSchema} from "../schema/actions.schema";
import { Action } from "./action";
import { ActionFactory } from "./action-factory";

export interface RandomActionCandidate {
    triggerId?: string;
    action?: Action;
    weight?: number;
    derivedWeight?: number;
}

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
        let weightSum = 0;
        const rand = Math.random();
        for(const candidate of this.candidates) {
            weightSum += candidate.weight || candidate.derivedWeight;
            if (rand < weightSum) {
                if (candidate.action) {
                    candidate.action.onAction();
                }
                else {
                    this.rootEngine.onTrigger(candidate.triggerId);
                }
            }
        }
    }

    static fromJSON(actionSchema: RandomActionSchema): RandomAction {
        return new RandomAction(
            actionSchema.candidates.map((c) => {
                return {
                    triggerId: c.triggerId,
                    action: c.action ? ActionFactory.create(c.action): null,
                    weight: c.weight
                };
            })
        );
    }

    public toJSON(): RandomActionSchema {
        return {
            type: ActionType.RANDOM,
            candidates: this.candidates.map((c) => {
                return {
                    triggerId: c.triggerId,
                    action: c.action?.toJSON(),
                    weight: c.weight
                }
            })
        };
    }

    toString(): string {
        return `Random action: todo`;   
    }
}