import { readdirSync, readFileSync } from 'fs';
import { RuleSchema } from '../rule-engine/schema/rule.schema';

export interface GameOption {
    gamestatePath: string;
    hardwarePath: string;
    label: string;
}

export class GameSelector {
    getGameOptions(): GameOption[] {
        const gamesDir = '/app/src/games';
        const gameConfigs: GameOption[] = [];
        const gameDirs = readdirSync(gamesDir);
        for(const gameDir of gameDirs) {
            for(const file of readdirSync(`${gamesDir}/${gameDir}`)) {
                // TODO: Fix this check
                if (file !== 'hardware-config.json' && file !== 'switch-alias.center-targets.json') {
                    const rules = JSON.parse(readFileSync(`${gamesDir}/${gameDir}/${file}`, {encoding: 'utf8'})) as unknown as RuleSchema
                    const entry = {
                        label: `[${gameDir}] ${rules.metadata.name} - ${rules.metadata.description?.substr(0, 50)}`,
                        gamestatePath: `${gamesDir}/${gameDir}/${file}`,
                        hardwarePath: `${gamesDir}/${gameDir}/hardware-config.json`
                    }
                    gameConfigs.push(entry);
                }
            }
        }
        return gameConfigs;
    }
}