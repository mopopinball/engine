import { Game } from './system/game';

if (!existsSync('./hardware-config.json') || !existsSync('./gamestate-config.json')) {
    throw new Error('Required config file(s) are missing. Please run ./setup/select-game.');
}

import { HardwareConfig } from './system/hardware-config.schema';
import { RuleSchema } from './system/rule-engine/schema/rule.schema';
import { existsSync, fstat, fsync, readFileSync, readSync } from 'fs';

const game = new Game(
    JSON.parse(readFileSync('./hardware-config.json', {encoding: 'utf8'})) as unknown as HardwareConfig,
    JSON.parse(readFileSync('./gamestate-config.json', {encoding: 'utf8'})) as unknown as RuleSchema
);
