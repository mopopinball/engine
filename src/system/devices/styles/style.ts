import { DesiredOutputStateType } from "../../rule-engine/desired-output-state";
import { OutputStyle } from "../../rule-engine/schema/rule.schema";

export interface Style {
    update(): DesiredOutputStateType;
    // toJSON(): OutputStyle;
}