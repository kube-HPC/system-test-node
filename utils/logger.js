const {
  createLogger,
  format,
  transports
} = require('winston');
const {
  combine,
  timestamp,
  label,
  prettyPrint,
  printf
} = format;
const path = require('path');
const winston = require('winston')
require('winston-daily-rotate-file');

// const { combine, timestamp, label, printf } = format

// let today = new Date()
// let dd = today.getDate()
// let mm = today.getMonth() + 1
// let yy = today.getFullYear()
// let date = `${dd}-${mm}-${yy}`
const custumLevels = {
  levels: {
    result: -1,
    error: 0,
    warn: 1,
    info: 2,
    verbose: 3,
    debug: 4,
    silly: 5
  }
}

const myFormat = printf(info => {
  return `${info.timestamp} ${info.label} ${info.level}: ${info.message}`;
});

var resultLevel = new(winston.transports.DailyRotateFile)({
  filename: 'result-%DATE%.log',
  level: 'result',
  dirname: 'logs',
  datePattern: 'DD-MM-YYYY',
  maxFiles: '7d'
});

var combinedLevel = new(winston.transports.DailyRotateFile)({
  filename: 'combined-%DATE%.log',
  dirname: 'logs',
  datePattern: 'DD-MM-YYYY',
  maxFiles: '7d'
});
var errorLevel = new(winston.transports.DailyRotateFile)({
  filename: 'error-%DATE%.log',
  level: 'error',
  dirname: 'logs',
  datePattern: 'DD-MM-YYYY',
  maxFiles: '7d'
});

var exceptionLevel = new(winston.transports.DailyRotateFile)({
  filename: 'exceptions-%DATE%.log',
  dirname: 'logs',
  datePattern: 'DD-MM-YYYY',
  maxFiles: '7d'
});

const logger = createLogger({
  levels: custumLevels.levels,
  level: 'info',
  format: combine(
    timestamp(),
    format.label({
      label: path.basename(module.parent.filename)
    }),
    myFormat
  ),
  transports: [
    // new transports.File({ filename: `logs/error${date}.log`, level: 'error' }),
    // new transports.File({ filename: `logs/combined${date}.log` })
    resultLevel,
    combinedLevel,
    errorLevel
  ],
  exceptionHandlers: [
    // new transports.File({ filename: `logs/exceptions${date}.log` })
    exceptionLevel
  ]

})
module.exports = logger