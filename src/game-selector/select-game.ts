import { existsSync, readdirSync, readFileSync, symlinkSync, unlink, unlinkSync } from 'fs';
import { resolve } from 'path';
import {terminal} from 'terminal-kit';
import { RuleSchema } from '../system/rule-engine/schema/rule.schema';

interface GameOption {
    gamestatePath: string;
    hardwarePath: string;
    label: string;
}

export class GameSelector {
    async run() {
        terminal.bold('\n\nMopo Pinball Game Selector\n\n');
        terminal('Visit https://github.com/mopopinball/engine/tree/master/src/games for detailed game information.\n\n');
        
        terminal.red('Be sure to select a game which corresponds to your physical hardware!');
        terminal(' Failure to do so could cause coils to fire instead of lights and vice versa.\n\n')
        
        terminal.bold('Select a game:');

        // find all game configs.
        const gamesDir = './src/games';
        const gameConfigs: GameOption[] = [];
        const gameDirs = readdirSync(gamesDir);
        for(const gameDir of gameDirs) {
            for(const file of readdirSync(`${gamesDir}/${gameDir}`)) {
                if (file !== 'hardware-config.json') {
                    const rules = JSON.parse(readFileSync(`${gamesDir}/${gameDir}/${file}`, {encoding: 'utf8'})) as unknown as RuleSchema
                    const entry = {
                        label: `[${gameDir}] ${rules.metadata.name} - ${rules.metadata.description.substr(0, 50)}`,
                        gamestatePath: `${gamesDir}/${gameDir}/${file}`,
                        hardwarePath: `${gamesDir}/${gameDir}/hardware-config.json`
                    }
                    gameConfigs.push(entry);
                }
            }
        }
        terminal.singleColumnMenu(gameConfigs.map((gc) => gc.label), {cancelable: true}, (err, response) => {
            if (response.canceled) {
                process.exit();
                return;
            }

            const gamestateDest = './src/gamestate-config.json';
            if (existsSync(gamestateDest)){
                unlinkSync(gamestateDest);
            }
            symlinkSync(resolve(gameConfigs[response.selectedIndex].gamestatePath), gamestateDest);

            const hardwareDest = './src/hardware-config.json';
            if (existsSync(hardwareDest)) {
                unlinkSync(hardwareDest);
            }
            symlinkSync(resolve(gameConfigs[response.selectedIndex].gamestatePath), hardwareDest);
            
            process.exit();
        });
        
    }
}