import { EventEmitter } from "events";
import { logger } from "../../logger";
import { TimerTriggerMode, TimerTriggerSchema, TriggerType } from "../schema/triggers.schema";
import { Trigger } from "./trigger"

export class TimerTrigger extends Trigger {
    readonly type = TriggerType.TIMER;
    public readonly eventEmitter: EventEmitter;
    private timeout: NodeJS.Timeout;
    
    constructor(public readonly id: string, public valueMs: number, public mode: TimerTriggerMode) {
        super();
        this.eventEmitter = new EventEmitter();
    }

    public start(): void {
        this.stop();
        logger.debug(`[Start Timer Action] ${this.id}`);
        
        if (this.mode === TimerTriggerMode.INTERVAL) {
            this.timeout = setInterval(() => this.tick(), this.valueMs);
        } else {
            this.timeout = setTimeout(() => this.tick(), this.valueMs);
        }
    }

    public stop(): void {
        if (this.timeout) {
            logger.debug(`[Stop Timer Action] ${this.id}`);
        }

        if (this.mode === TimerTriggerMode.INTERVAL) {
            clearInterval(this.timeout);
        } else {
            clearTimeout(this.timeout);
        }
        this.timeout = null;
    }

    private tick(): void {
        this.eventEmitter.emit('tick');
    }

    static fromJSON(triggerSchema: TimerTriggerSchema): TimerTrigger {
        return new TimerTrigger(triggerSchema.id, triggerSchema.valueMs, triggerSchema.mode);
    }

    toJSON(): TimerTriggerSchema {
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