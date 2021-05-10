// import {createLogger, format, transports} from 'winston';
// import Debug from 'debug';
import log from 'loglevel';

export const logger = log;

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