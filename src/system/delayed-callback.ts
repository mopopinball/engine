export class DelayedCallback {
    private timeout: NodeJS.Timeout;
    
    constructor(private callback: () => void, private delay: number) {
    }

    start(): void {
        this.clear();
        this.timeout = setTimeout(() => this.callback(), this.delay);
    }

    clear(): void {
        clearTimeout(this.timeout);
    }
}