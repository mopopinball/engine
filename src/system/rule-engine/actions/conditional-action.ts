import { PlayfieldLamp } from "../../../devices/playfield-lamp";
import { RuleData } from "../rule-data";
import { Action } from "./action";

export class ConditionalAction extends Action {
    constructor(
        id: string, private condition: string[], private trueResult: string, private falseResult: string, actions: Map<string, Action>,
        nextCollection: string[]) {
        super(id, actions, nextCollection);
    }
    
    onAction(data: Map<string, RuleData>, devices: Map<string, PlayfieldLamp>): void {
        let result: boolean;
        switch(this.condition[0]) {
            case 'data':
                result = this.onData(this.condition[1], this.condition[2], this.condition[3], data);
                break;
        }

        if (result) {
            this.actions.get(this.trueResult).handle(data, devices);
        } else {
            this.actions.get(this.falseResult).handle(data, devices);
        }
    }

    onData(key: string, operator: string, value: string, data: Map<string, RuleData>): boolean {
        const d = data.get(key);
        switch(operator) {
            case '>':
                return d.value > parseInt(value);
        }
    }

}