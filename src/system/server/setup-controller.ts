import express from 'express';
import { GithubRelease } from '../github-release';
import { Update } from '../update';
import { Controller } from "./controller";
import cors from 'cors';
import { HardwareConfig } from '../hardware-config.schema';
import { GameOption, GameSelector } from '../../game-selector/select-game';
import { copyFileSync } from 'fs';
import { join } from 'path';

interface SetupState {
    required: boolean;
}

export class SetupController implements Controller {
    constructor(private hardwareConfig: HardwareConfig) {}

    setup(app: express.Express): void {
        app.post('/update/apply', async (req, res) => {
            const selectedUpdate = req.body as GithubRelease;
            await Update.getInstance().applyUpdate(selectedUpdate, true);
            res.send({result: 'ok'});
        });

        app.get('/setup/state', cors(), (req, res) => {
            const state: SetupState = {
                required: !this.hardwareConfig?.system
            };

            res.send(state);
        });

        app.get('/setup/games', cors(), (req, res) => {
            res.send(this.getHardwareConfigs());
        });

        app.post('/setup/games', (req, res) => {
            const dataDir = '/app/data'
            const selectedGame = req.body as GameOption;
            copyFileSync(selectedGame.hardwarePath, join(dataDir, 'hardware-config.json'));
            copyFileSync(selectedGame.gamestatePath, join(dataDir, 'gamestate-config.json'))

            res.send(200);

            process.exit(0);
        });
    }

    getHardwareConfigs(): GameOption[] {
        const gameSelector = new GameSelector();
        return gameSelector.getGameOptions();
    }
}
