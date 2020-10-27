import { Game } from "./game";
import * as hardwareConfig from "./games/mars/config.json";
import * as gameConfig from './system/rule-engine/test-data.json'
import { HardwareConfig } from "./system/hardware-config.schema";
import { RuleSchema } from "./system/rule-engine/schema/rule.schema";


describe('game', () => {
    it('loads', () => {
        // setup
        const game = new Game(
            hardwareConfig as unknown as HardwareConfig, gameConfig as unknown as RuleSchema
        );
        game.onSetupComplete();
    });
});