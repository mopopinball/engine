import express from 'express';
import basicAuth from 'express-basic-auth';
const app = express();

import path from 'path';
import { logger } from '../logger';
import { Security } from '../security';
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
        const staticDir = path.resolve(__dirname + '../../../../admin');
        logger.info(`Setting static dir to ${staticDir}`);
        const users = {
            admin: Security.getInstance().getPinCode().toString(),
            developer: 'abc123' //todo: Remove this!
        };
        basicAuth({users})
        app.use(basicAuth({
            users: users,
            challenge: true,
            realm: 'mopo'
        }));
        app.use(express.static(staticDir));
        app.listen(port, () => logger.info(`Mopo Pinball admin webserver listening on port ${port}!`));
    }
}
