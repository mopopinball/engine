export abstract class DirtyNotifier {
    private callback: (arg0: this) => void;
    
    onDirty(callback: (arg0: this) => void): void {
        this.callback = callback;  
    }

    protected emitDirty() {
        if (this.callback) {
            this.callback(this);
        }
    }
}