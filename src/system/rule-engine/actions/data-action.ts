import { PlayfieldLamp2 } from "../../playfieldLamp2";
import { RuleData } from "../rule-data";
import { Action } from "./action";

export class DataAction implements Action {
    constructor(private dataKey: string, private operation: DataOperation, private operand: number) {
    }
    
    handle(data: Map<string, RuleData>, devices: Map<string, PlayfieldLamp2>) {
        // todo: operate
        if (this.operation === DataOperation.INCREMENT) {
            data.get(this.dataKey).value += this.operand; 
        }
    }
}

export enum DataOperation {
    INCREMENT,
    DECREMENT
}