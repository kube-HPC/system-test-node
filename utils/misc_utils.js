const path = require('path');

const logger = require('../utils/logger')



const write_log = (st, sv = 'info') => {
    console.log(st)
    logger.level = sv
    logger[logger.level](st)
    logger.level = 'info'

}

/**
 * A delay function that prints a progress message at each interval,
 * updating the same log line with each check.
 *
 * @param {string} msg - The message to display during the delay.
 * @param {number} timeout - The total timeout in milliseconds for the delay.
 * @param {number} [interval=10000] - Optional. The delay interval in milliseconds between each check.
 * @returns {Promise<void>} - A promise that resolves after the specified timeout.
 */
const intervalDelay = async (msg, timeout, interval = 10 * 1000) => {
    const totalChecks = Math.ceil(timeout / interval);
    for (let check = 1; check <= totalChecks; check++) {
        process.stdout.write(`\r${msg}: ${check}/${totalChecks}`);
        await delay(interval);
    }
    console.log();
};



module.exports = {
    write_log,
    intervalDelay
}