export type DataItem = NumberData | StringData;

export interface NumberData extends DataBase<number> {
    type: 'number';
    attributes?: {
        isWholeNumber?: boolean,
        resetOnStateStop?: boolean
    }
}

export interface StringData extends DataBase<string> {
    type: 'string';
}

export interface DataBase<T> {
    id: string;
    value: T;
    initValue: T;
    attributes?: {
        resetOnStateStop?: boolean   
    }
}