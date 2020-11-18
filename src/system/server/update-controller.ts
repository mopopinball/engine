import express from 'express';
import { Update } from '../update';
import { Controller } from "./controller";

export class UpdateController implements Controller {
    setup(app: express.Express): void {
        app.post('/update/check', async (req, res) => {
            const availableUpdate = await Update.getInstance().getAvailableSystemUpdate(false);
            const availablePicUpdate = await Update.getInstance().getAvailablePicUpdate(false);
            res.send({
                system: availableUpdate,
                pics: availablePicUpdate
            });
        });
    }
}