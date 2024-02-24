import express from 'express';
import basicAuth from 'express-basic-auth';
import bodyParser from 'body-parser';
const app = express();

import { resolve } from 'path';
import { logger } from '../logger';
import { Security } from '../security';
import { UpdateController } from './update-controller';
import { SetupController } from './setup-controller';
import { HardwareConfig } from '../hardware-config.schema';
const port = 1983;

/**
 * Web server.
 */
export class Server {
    private server: any;

    constructor(private hardwareConfig: HardwareConfig){}

    start(): void {
        // Our process starts via systemd potentially before networking is ready. Wait some time
        // and then start our webserver.
        setTimeout(
            () => this.setupWebserverBindings(),
            10 * 1000
        );
    }

    setupWebserverBindings(): void {
        const staticDir = resolve('/app/servicemenu');
        logger.info(`Setting static dir to ${staticDir}`);
        // TODO: refresh the pin code periodically and update the security/users.
        const pinCode = Security.getInstance().hasPinCode() ? Security.getInstance().getPinCode().toString() : 'admin';
        const users = {
            admin: pinCode,
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

        this.server = app.listen(port, () => logger.info(`Mopo Pinball service menu listening on port ${port}`));
        this.server.setTimeout(5 * 60 * 1000); // 5 minutes
    }

    private setupControllers() {
        new UpdateController().setup(app);
        new SetupController(this.hardwareConfig).setup(app);
    }
}
