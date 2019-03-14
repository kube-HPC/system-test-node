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
  
  const myFormat = printf(info => {
    return `${info.timestamp} ${info.label} ${info.level}: ${info.message}`;
  });
  
  var combinedLevel = new (winston.transports.DailyRotateFile)({
    filename: 'combined-%DATE%.log',
    dirname: 'logs',
    datePattern: 'DD-MM-YYYY',
    maxFiles: '1d'
  });
  var errorLevel = new (winston.transports.DailyRotateFile)({
    filename: 'error-%DATE%.log',
    level: 'error',
    dirname: 'logs',
    datePattern: 'DD-MM-YYYY',
    maxFiles: '1d'
  });
  
  var exceptionLevel = new (winston.transports.DailyRotateFile)({
    filename: 'exceptions-%DATE%.log',
    dirname: 'logs',
    datePattern: 'DD-MM-YYYY',
    maxFiles: '1d'
  });
  
  const logger = createLogger({
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
      combinedLevel,
      errorLevel
    ],
    exceptionHandlers: [
      // new transports.File({ filename: `logs/exceptions${date}.log` })
      exceptionLevel
    ]
  
  })
  module.exports = logger