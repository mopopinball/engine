export class GameClock {
    private static instance: GameClock;

    private readonly MS_PER_FRAME = 33; // 30fps
    public loopStart: number;
    private loopEnd: number;

    public static getInstance(): GameClock {
        if (!GameClock.instance) {
            GameClock.instance = new GameClock();
        }

        return GameClock.instance;
    }

    public startLoop(): number {
        this.loopStart = this.getCurrentTime();
        return this.loopStart;
    }

    public endLoop(): number {
        this.loopEnd = this.getCurrentTime();
        return this.loopEnd;
    }

    public getLoopDelay(): number {
        let loopDelay = this.loopStart + this.MS_PER_FRAME - this.loopEnd;
        if (loopDelay < 0) {
            loopDelay = 0;
        }
        return loopDelay;
    }

    public getLoopDuration(): number {
        return this.loopEnd - this.loopStart;
    }

    private getCurrentTime(): number {
        return new Date().valueOf();
    }
}