import { HardwareConfig } from "./hardware-config.schema";
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { RuleSchema } from "./rule-engine/schema/rule.schema";
import { RuleEngine } from "./rule-engine/rule-engine";
import { SwitchAliasSchema } from "./switch-alias.schema";
import { gamestateConfigPath, hardwareConfigPath } from "./constants";
import { logger } from "./logger";

export abstract class ConfigLoader {
    public static loadHardwareConfig(): HardwareConfig {
        if (!existsSync(hardwareConfigPath)) {
            logger.warn(`No hardware config found at ${hardwareConfigPath}`);
            return null;
        }
        return this.loadFile<HardwareConfig>(hardwareConfigPath);
    }

    public static loadRuleSchema(): RuleSchema {
        if (!existsSync(gamestateConfigPath)) {
            logger.warn(`No rules config found at ${gamestateConfigPath}`);
            return null;
        }
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