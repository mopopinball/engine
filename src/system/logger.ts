// import {createLogger, format, transports} from 'winston';
// import Debug from 'debug';
import log from 'loglevel';
import {apply, reg} from 'loglevel-plugin-prefix';

// const colors = {
//     TRACE: chalk.magenta,
//     DEBUG: chalk.cyan,
//     INFO: chalk.blue,
//     WARN: chalk.yellow,
//     ERROR: chalk.red,
//   };

reg(log);

apply(log, {
    format(level, name, timestamp) {
        return `[${timestamp}]`;
    },
});

/** The main logger for the server. */
export const logger = log;

export const welcomeLogger = () => {
    const logLevel = logger.getLevel();
    switch (logLevel) {
    case 0:
        logger.info('Log level set to TRACE');
        break;
    case 1:
        logger.info('Log level set to DEBUG');
        break;
    case 2:
        logger.info('Log level set to INFO');
        break;
    case 3:
        logger.info('Log level set to WARN');
        break;
    case 4:
        logger.info('Log level set to ERROR');
        break;
    case 5:
        logger.info('Log level set to SILENT');
        break;
    default:
        logger.info('Log level set to UNKNOWN');
        break;
    }
};

// export const logger = createLogger({
//     level: 'debug',
//     format: format.combine(
//         format.timestamp({
//             format: 'YYYY-MM-DD HH:mm:ss.SSS'
//         }),
//         format.simple()
//     ),
//     transports: [],
// });

// if (process.env.NODE_ENV === 'production') {
//     logger.add(new transports.File({
//         filename: '/home/pi/mopo/engine/mopo.log',
//         maxsize: 4194304,
//         maxFiles: 5,
//         tailable: true
//     }));
// }
// else {
//     logger.add(new transports.Console());
// }