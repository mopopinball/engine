import { Game } from './system/game';
import { HardwareConfig } from './system/hardware-config.schema';
import { RuleSchema } from './system/rule-engine/schema/rule.schema';
import { existsSync, readFileSync } from 'fs';

const hardwareConfigPath = '/home/pi/mopo/hardware-config.json';
const gamestateConfigPath = '/home/pi/mopo/gamestate-config.json';

if (!existsSync(hardwareConfigPath) || !existsSync(gamestateConfigPath)) {
    throw new Error('Required config file(s) are missing. Please run ./setup/select-game.');
}

new Game(
    JSON.parse(readFileSync(hardwareConfigPath, {encoding: 'utf8'})) as unknown as HardwareConfig,
    JSON.parse(readFileSync(gamestateConfigPath, {encoding: 'utf8'})) as unknown as RuleSchema
);
