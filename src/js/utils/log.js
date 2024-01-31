// import { app, remote } from 'electron'
import log from 'electron-log'

// const logFormat = '{level} | {y}-{m}-{d} {h}:{i}:{s}:{ms} | {text}';

log.transports.file.level = false;
log.transports.console.level = 'debug';
log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

let logger;
logger = log;
// console.log = log



// logger.transports.file.level = "debug";
// logger.transports.file.maxSize = 1002430; // 文件最大步超過 10M
// logger.transports.file.file = app.getPath('userData')+ 'logs/main.log';

const simpleStringify = object => {
  const simpleObject = {};
  Object.keys(object).forEach(prop => {
    if (
      Object.prototype.hasOwnProperty.call(object, prop) &&
      typeof object[prop] !== 'object' &&
      typeof object[prop] !== 'function'
    ) {
      simpleObject[prop] = object[prop];
    }
  });
  log.info('simpleObject__', simpleObject)
  return simpleObject; // returns cleaned up JSON
  // return JSON.stringify(simpleObject); // returns cleaned up JSON
};

// (() => {
//   // saving the original console.log function
//   // const preservedConsoleLog = console.log;
//   // const preservedConsoleError = console.error;
//   // overriding console.log function
//   function customLog() {
//     log.info(arguments)
//     // we can't just call to `preservedConsoleLog` function,
//     // that will throw an error (TypeError: Illegal invocation)
//     // because we need the function to be inside the
//     // scope of the `console` object so we going to use the
//     // `apply` function

//     let text
//     if (arguments.length > 0) {
//       for (let i = 0; i < arguments.length; i++) {
//         log.info('arguments[i]__', arguments[i])
//         text += arguments[i]
//         // log.info(`LOG | Argument ${i + 1}: ${arguments[i]}`);
//       }
//     }
//     log.info('text__', text);

//     // if (process.env.NODE_ENV !== 'production') {
//       // log.info(`${simpleStringify(arguments)}`);
//     // }
//     // remoteLog.info(`LOG | ${JSON.stringify(arguments)}`);
//   }

//   function customError() {
//     // we can't just call to `preservedConsoleLog` function,
//     // that will throw an error (TypeError: Illegal invocation)
//     // because we need the function to be inside the
//     // scope of the `console` object so we going to use the
//     // `apply` function

//     // if (process.env.NODE_ENV !== 'production') {
//       log.error(`ERROR | ${arguments}`);
//     // }
//     // remoteLog.error(`ERROR | ${JSON.stringify(arguments)}`);
//   }

//   // if (process.env.NODE_ENV !== 'test') {
//     console.log = customLog;
//     console.error = customError;
//   // }
// })();

/**
 * info log
 * @param {*} msg
 */
const info = (msg) => {
  // logger.log(msg, 'info')
}

// /**
//  * warn log
//  * @param {*} msg
//  */
// const warn = (msg) => {
//   logger.log(msg, 'warn')
// }

// /**
//  * error log
//  * @param {*} msg
//  */

// const error = (msg) => {
//   logger.log(msg, 'error')
// }


// export default {info}
export default logger
