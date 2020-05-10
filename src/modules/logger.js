const winston = require('winston');
const format = winston.format;

/**
 * Logging.
 */

const logger = winston.createLogger({
    level: 'debug',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }),
        format.simple()
    ),
    transports: [],
});

if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
        name: 'filelogger',
        filename: '/home/pi/mopo/mopo.log',
        maxsize: 4194304,
        maxFiles: 5,
        tailable: true
    }));
}
else {
    logger.add(new winston.transports.Console());
}

module.exports = logger;
