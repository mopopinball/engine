import { ActionType, RandomActionSchema } from "../schema/rule.schema";
import { Action } from "./action";

export interface RandomActionCandidate {
    triggerId: string;
    weight?: number;
    derivedWeight?: number;
}

export class RandomAction extends Action {
    constructor(private candidates: RandomActionCandidate[]) {
        super();
    }

    public updateWeights(): void {
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
                this.rootEngine.onTrigger(candidate.triggerId);
            }
        }
    }

    static fromJSON(actionSchema: RandomActionSchema): RandomAction {
        return new RandomAction(
            actionSchema.candidates.map((c) => {
                return {
                    triggerId: c.triggerId,
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
                    weight: c.weight || c.derivedWeight
                }
            })
        };
    }

    toString(): string {
        return `Random action: todo`;   
    }
}