import express from 'express';
import { Board } from '../board';
import { GithubRelease } from '../github-release';
import { EVENTS, MessageBroker } from '../messages';
import { Update } from '../update';
import { Controller } from "./controller";
import cors from 'cors';
import { logger } from '../logger';

export class UpdateController implements Controller {
    setup(app: express.Express): void {
        app.post('/update/check', async (req, res) => {
            let availableUpdate: GithubRelease = null;
            let availableServiceMenuUpdate: GithubRelease = null;
            let availablePicUpdate: GithubRelease = null;
            try {
                availableUpdate = await Update.getInstance().getAvailableSystemUpdate(true);
            }
            catch(e) {
                logger.error(e);
            }
            try {
                availableServiceMenuUpdate = await Update.getInstance().getAvailableServiceMenuUpdate(false);
            }
            catch(e) {
                logger.error(e);
            }
            try {
                availablePicUpdate = await Update.getInstance().getAvailablePicUpdate(true);
            }
            catch(e) {
                logger.error(e);
            }

            res.send({
                system: availableUpdate,
                pics: availablePicUpdate,
                serviceMenu: availableServiceMenuUpdate
            });
        });

        app.post('/update/apply', async (req, res) => {
            const selectedUpdate = req.body as GithubRelease;
            await Update.getInstance().applyUpdate(selectedUpdate, true);
            res.send({result: 'ok'});
        });

        app.get('/update/ruleEngine/status', cors(), (req, res) => {
            res.send({
                debugEnabled: Board.getInstance().isDebugEnabled()
            });
        });

        app.post('/update/ruleEngine/schema', cors(), (req, res) => {
            if (!Board.getInstance().isDebugEnabled()) {
                res.sendStatus(401);
                return;
            }

            MessageBroker.getInstance().emit(EVENTS.NEW_RULE_SCHEMA, req.body);
            res.send({});
        });
    }
}
