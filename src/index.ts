import { Game } from './system/game';
import { existsSync } from 'fs';
import { ConfigLoader } from './system/config-loader';

const hardwareConfigPath = '/home/pi/mopo/hardware-config.json';
const gamestateConfigPath = '/home/pi/mopo/gamestate-config.json';

if (!existsSync(hardwareConfigPath) || !existsSync(gamestateConfigPath)) {
    throw new Error('Required config file(s) are missing. Please run ./setup/select-game.');
}

new Game(
    ConfigLoader.loadHardwareConfig(),
    ConfigLoader.loadRuleSchema()
);
