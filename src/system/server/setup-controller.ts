import { Express } from 'express';
import { Controller } from "./controller";
import cors from 'cors';
import { HardwareConfig } from '../hardware-config.schema';
import { GameOption, GameSelector } from './select-game';
import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { gamestateConfigPath, hardwareConfigPath, picPathAvailable, picPathInstalled } from '../constants';
import { DriverPic } from '../devices/driver-pic';
import { DisplaysPic } from '../devices/displays-pic';
import { SwitchesPic } from '../devices/switches-pic';
import { execSync } from 'child_process';
import { logger } from '../logger';
import { Pic } from '../devices/pic';

export interface SetupState {
    required: boolean;
    pics: {
        driver: {
            required: boolean
        },
        switches: {
            required: boolean
        },
        displays: {
            required: boolean
        },
    }
}

export class SetupController implements Controller {
    constructor(private hardwareConfig: HardwareConfig) {}

    setup(app: Express): void {
        app.get('/update', cors(), (req, res) => {
            const available = new Date(JSON.parse(execSync('curl -s https://api.github.com/repos/mopopinball/engine/releases/latest').toString()).created_at);
            logger.info(`Available version ${available}`);

            const current = new Date(JSON.parse(execSync('docker inspect ghcr.io/mopopinball/engine:master').toString())[0].Created);
            logger.info(`Current version ${current}`);

            if(current.valueOf() < available.valueOf()) {
                res.send({available: true});
            }
            else {
                res.send({available: false});
            }
        });

        app.get('/setup/state', cors(), (req, res) => {
            const state: SetupState = {
                required: !this.hardwareConfig?.system,
                pics: {
                    driver: {
                        required: DriverPic.getInstance().updateRequired()
                    },
                    displays: {
                        required: DisplaysPic.getInstance().updateRequired()
                    },
                    switches: {
                        required: SwitchesPic.getInstance().updateRequired()
                    },
                }
            };

            res.send(state);
        });

        app.get('/setup/games', cors(), (req, res) => {
            res.send(this.getHardwareConfigs());
        });

        app.post('/setup/games', (req, res) => {
            const selectedGame = req.body as GameOption;
            copyFileSync(selectedGame.hardwarePath, hardwareConfigPath);
            copyFileSync(selectedGame.gamestatePath, gamestateConfigPath)

            res.sendStatus(200);

            process.exit(0);
        });

        app.post('/setup/restart', (req, res) => {
            logger.warn('Restarting');
            res.sendStatus(200);
            process.exit(0);
        });

        app.post('/setup/pic/:picId', (req, res) => {
            const pic = req.params.picId;
            logger.info(`Updating ${pic} PIC.`);

            const flashSuccess = Pic.flash(pic);
            if(flashSuccess) {
                if(!existsSync(picPathInstalled)) {
                    mkdirSync(picPathInstalled, { recursive: true });
                }
                copyFileSync(join(picPathAvailable, `${pic}-version.json`), join(picPathInstalled, `${pic}-version.json`));
                res.sendStatus(200);
            }
            else {
                res.sendStatus(500);
            }
        });
    }

    getHardwareConfigs(): GameOption[] {
        const gameSelector = new GameSelector();
        return gameSelector.getGameOptions();
    }
}
