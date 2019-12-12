const path = require('path');

const logger = require(path.join(process.cwd(), 'utils/logger'))



const write_log = (st, sevirity = info) => {
    console.log(st)
    logger.sevirity(st)
}



module.exports = {
    write_log
}