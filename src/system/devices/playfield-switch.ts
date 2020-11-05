import { Switch } from "./switch";

/**
 * tr
 */
export class PlayfieldSwitch extends Switch {
    constructor(
        id: string, public number: number, public name: string, debounceIntervalMs?: number,
        public qualifiesPlayfield?: boolean
    ) {
        super(id, false, debounceIntervalMs);
    }
}
