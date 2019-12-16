const path = require('path');

const logger = require(path.join(process.cwd(), 'utils/logger'))



const write_log = (st, sv = 'info') => {
    console.log(st)
    logger.level = sv
    logger[logger.level](st)
    logger.level = 'info'
   
}



module.exports = {
    write_log
}