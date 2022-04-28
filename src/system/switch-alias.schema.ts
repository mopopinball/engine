export interface SwitchAliasSchema {
    [key: string]: SwitchAliasSchemaItem
}

export interface SwitchAliasSchemaItem {
    description: string,
    switches: string[];
}