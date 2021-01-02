export interface RuleData {
    id: string;
    value: number;
    initValue: number;
    attributes?: {
        isWholeNumber?: boolean,
        resetOnStateStop?: boolean
    }
}