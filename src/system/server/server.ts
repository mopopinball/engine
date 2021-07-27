import express from 'express';
import basicAuth from 'express-basic-auth';
import bodyParser from 'body-parser';
const app = express();

import path from 'path';
import { logger } from '../logger';
import { Security } from '../security';
import { UpdateController } from './update-controller';
const port = 80;

/**
 * Web server.
 */
export class Server {
    start(): void {
        // Our process starts via systemd potentially before networking is ready. Wait some time
        // and then start our webserver.
        setTimeout(
            () => this.setupWebserverBindings(),
            10 * 1000
        );
    }

    setupWebserverBindings(): void {
        const staticDir = path.resolve('/home/pi/mopo/servicemenu');
        logger.info(`Setting static dir to ${staticDir}`);
        // TODO: refresh the pin code periodically and update the security/users.
        const users = {
            admin: Security.getInstance().getPinCode().toString(),
            developer: 'abc123' //TODO: Remove this!
        };
        basicAuth({users})
        app.use(basicAuth({
            users: users,
            challenge: true,
            realm: 'mopo'
        }));
        app.use(express.static(staticDir));
        app.use(bodyParser.json())

        this.setupControllers();

        app.listen(port, () => logger.info(`Mopo Pinball service menu listening on port ${port}`));
    }

    private setupControllers() {
        new UpdateController().setup(app);
    }
}
