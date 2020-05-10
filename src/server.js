const Security = require('./system/security');
const basicAuth = require('express-basic-auth');
const moment = require('moment');
const express = require('express');
const logger = require('.system/logger');
const app = express();
const port = 80;
const path = require('path');

/**
 * Web server.
 */
class Server {
    start() {
        // Our process starts via systemd potentially before networking is ready. Wait some time
        // and then start our webserver.
        setTimeout(
            () => this.setupWebserverBindings(),
            moment.duration(10, 'seconds').valueOf()
        );
    }

    setupWebserverBindings() {
        const staticDir = path.resolve(__dirname + '../../../../site');
        logger.info(`Setting static dir to ${staticDir}`);
        app.use(basicAuth({
            users: {
                admin: Security.getPinCode().toString(),
                developer: 'abc123'
            },
            challenge: true,
            realm: 'mopo'
        }));
        app.use(express.static(staticDir));
        app.listen(port, () => logger.info(`Mopo Pinball webserver listening on port ${port}!`));
    }
}

module.exports = Server;
