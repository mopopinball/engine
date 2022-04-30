import { Game } from './system/game';
import { ConfigLoader } from './system/config-loader';
import { welcomeLogger } from './system/logger';

welcomeLogger();

const game = new Game(
    ConfigLoader.loadHardwareConfig(),
    ConfigLoader.loadRuleSchema()
);

const exitHandler = () => {
    game.exit();
    // give it sime time to exit.
    setTimeout(() => {process.exit();}, 250);
}

//do something when app is closing
process.on('exit', () => exitHandler());

//catches ctrl+c event
process.on('SIGINT', () => exitHandler());

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', () => exitHandler());
process.on('SIGUSR2', () => exitHandler());
