import { EventEmitter } from "events";
import { logger } from "../../logger";
import { TimerTriggerMode, TimerTriggerSchema, TriggerTypeEnum } from "../schema/triggers.schema";
import { Trigger } from "./trigger"

export class TimerTrigger extends Trigger {
    public readonly eventEmitter: EventEmitter;
    private timeout: NodeJS.Timeout;
    
    constructor(public id: string, public valueMs: number, public mode: TimerTriggerMode) {
        super(TriggerTypeEnum.TIMER);
        this.eventEmitter = new EventEmitter();
    }

    public start(): void {
        this.stop();
        logger.debug(`[Start Timer Action] ${this.id} (${this.valueMs}ms)`);
        
        if (this.mode === TimerTriggerMode.INTERVAL) {
            this.timeout = setInterval(() => this.tick(), this.valueMs);
        }
        else {
            this.timeout = setTimeout(() => this.tick(), this.valueMs);
        }
    }

    public stop(): void {
        if (this.timeout) {
            logger.debug(`[Stop Timer Action] ${this.id} (${this.valueMs}ms)`);
        }

        if (this.mode === TimerTriggerMode.INTERVAL) {
            clearInterval(this.timeout);
        }
        else {
            clearTimeout(this.timeout);
        }
        this.timeout = null;
    }

    private tick(): void {
        logger.debug(`[Timer Action] tick ${this.id}`)
        this.eventEmitter.emit('tick');
    }

    static fromJSON(triggerSchema: TimerTriggerSchema): TimerTrigger {
        const trigger = new TimerTrigger(triggerSchema.id, triggerSchema.valueMs, triggerSchema.mode);
        trigger.designer = triggerSchema.designer;
        return trigger;
    }

    toJSON(): TimerTriggerSchema {
        const convertedBase = super.toJSON();
        return {
            type: TriggerTypeEnum.TIMER,
            id: this.id,
            mode: this.mode,
            valueMs: this.valueMs,
            actions: convertedBase.actions,
            designer: convertedBase.designer
        };
    }

    toString(): string {
        return `[Timer Trigger] ${this.id} (${this.valueMs}ms)`;
    }
}