import { ActionType, TimedActionSchema } from "../schema/actions.schema";
import { Action } from "./action";
import { ActionFactory } from "./action-factory";

export interface TimedActionStep {
    intervalMs: number,
    actions: Action[]
}

/**
 * Executes child actions in a timed series of steps. Usefull for creating scripted sequences.
 */
export class TimedAction extends Action {
    private timeout: NodeJS.Timeout;
    public currentStep: TimedActionStep = null;

    constructor(public id: string, public steps: TimedActionStep[]) {
        super(ActionType.TIMED);
    }

    rollback(): void {
        this.cancel();
    }
    
    onAction(): void {
        this.cancel();
        this.runNext();
    }

    private runNext(): void {
        const isNewStep = this.setNewCurrentStep();
        if (!isNewStep) {
            return;
        }

        this.runCurrentStep();

        this.timeout = setInterval(() => this.runNext(), this.currentStep.intervalMs);
    }

    public setNewCurrentStep(): boolean {
        if (!this.steps.length) {
            return false;
        }
        if (!this.currentStep) {
            this.currentStep = this.steps[0];
            return true;
        }
        else if (this.steps.indexOf(this.currentStep) < this.steps.length - 1) {
            this.currentStep = this.steps[this.steps.indexOf(this.currentStep) + 1];
            return true;
        }
        else {
            return false;
        }
    }

    public runCurrentStep(): void {
        if (!this.currentStep) {
            return;
        }

        for(const action of this.currentStep.actions) {
            action.handle(this.rootEngine, this.data, this.devices);
        }
    }

    public cancel(): void {
        clearInterval(this.timeout);
    }

    public toJSON(): TimedActionSchema {
        return {
            type: ActionType.TIMED,
            id: this.id,
            steps: this.steps.map((s) => {
                return {
                    intervalMs: s.intervalMs,
                    actions: s.actions.map((a) => a.toJSON())
                };
            }),
            designer: this.designer
        };
    }

    public static fromJSON(actionSchema: TimedActionSchema): TimedAction {
        const action = new TimedAction(
            actionSchema.id,
            actionSchema.steps.map((s) => {
                return {
                    intervalMs: s.intervalMs,
                    actions: s.actions.map((a) => ActionFactory.create(a))
                };
            })
        );
        action.designer = actionSchema.designer;

        return action;
    }

    public toString(): string {
        return `[Timed Action]`;
    }
    
}