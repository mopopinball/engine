import { DesiredOutputStateType } from "../../rule-engine/desired-output-state";

export interface Style {
    update(): DesiredOutputStateType;
}