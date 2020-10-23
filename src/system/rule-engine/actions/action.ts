import { PlayfieldLamp2 } from "../../playfieldLamp2";
import { RuleData } from "../rule-data";

export interface Action {
    handle(data: Map<string, RuleData>, devices: Map<string, PlayfieldLamp2>): void;
}