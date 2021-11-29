import { HardwareConfig } from "./hardware-config.schema";
import { readFileSync, writeFileSync } from 'fs';
import { RuleSchema } from "./rule-engine/schema/rule.schema";
import { RuleEngine } from "./rule-engine/rule-engine";
import { SwitchAliasSchema } from "./switch-alias.schema";

const hardwareConfigPath = '/home/pi/mopo/hardware-config.json';
const gamestateConfigPath = '/home/pi/mopo/gamestate-config.json';

export abstract class ConfigLoader {

    public static loadHardwareConfig(): HardwareConfig {
        return this.loadFile<HardwareConfig>(hardwareConfigPath);
    }

    public static loadRuleSchema(): RuleSchema {
        return this.loadFile<RuleSchema>(gamestateConfigPath);
    }

    private static loadFile<T>(path: string) : T {
        return JSON.parse(readFileSync(path, {encoding: 'utf8'})) as unknown as T;
    }

    public static saveRuleSchema(ruleEngine: RuleEngine): void {
        writeFileSync(gamestateConfigPath, JSON.stringify(ruleEngine), {encoding: 'utf8'});
    }

    public static loadAllSwitchAliases(): SwitchAliasSchema[] {
        // TODO: how we get the paths?
        const paths: string[] = [];
        return paths.map((p) => this.loadFile(p));
    }
}