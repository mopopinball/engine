import { EventEmitter } from "events";
import { TimerActionTriggerSchema, TriggerType } from "../schema/rule.schema";
import { ActionTrigger } from "./action-trigger"

export enum TimerActionTriggerMode {
    INTERVAL,
    TIMEOUT
}

export class TimerActionTrigger extends ActionTrigger {
    readonly type = TriggerType.TIMER;
    public readonly eventEmitter: EventEmitter;
    private timeout: NodeJS.Timeout;
    
    constructor(public readonly id: string, public valueMs: number, public mode: TimerActionTriggerMode) {
        super();
        this.eventEmitter = new EventEmitter();
    }

    public start(): void {
        this.stop();
        
        if (this.mode === TimerActionTriggerMode.INTERVAL) {
            this.timeout = setInterval(() => this.tick(), this.valueMs);
        } else {
            this.timeout = setTimeout(() => this.tick(), this.valueMs);
        }
    }

    public stop(): void {
        if (this.mode === TimerActionTriggerMode.INTERVAL) {
            clearInterval(this.timeout);
        } else {
            clearTimeout(this.timeout);
        }
    }

    private tick(): void {
        this.eventEmitter.emit('tick');
    }

    static fromJSON(triggerSchema: TimerActionTriggerSchema): TimerActionTrigger {
        return new TimerActionTrigger(triggerSchema.id, triggerSchema.valueMs, triggerSchema.mode);
    }

    toJSON(): TimerActionTriggerSchema {
        const convertedBase = super.toJSON();
        return {
            type: this.type,
            id: this.id,
            mode: this.mode,
            valueMs: this.valueMs,
            actions: convertedBase.actions
        };
    }

    toString(): string {
        return `Timer trigger ${this.id} (${this.valueMs})ms`;
    }
}