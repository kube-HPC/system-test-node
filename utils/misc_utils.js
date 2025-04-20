const chai = require('chai');
const delay = require('delay');
const logger = require('../utils/logger')
const expect = chai.expect;


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
const intervalDelay = async (msg, timeout, interval = 2 * 1000) => {
    const start = Date.now();
    do {
        process.stdout.write(`\r${msg}: ${Date.now() - start}/${timeout} ms...`);
        await delay(interval);
    } while (Date.now() - start < timeout);
    process.stdout.write(`\r${msg}: ${timeout}/${timeout} ms - done waiting.`);
    console.log();
};

// Helper function to check if a condition is met, with retries and delays.
const _checkConditionWithRetries = async (conditionFn, computeFn, computeFuncArguments = [], retryDelay = 10000, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        const computedValue = await computeFn(...computeFuncArguments);
        if (conditionFn(computedValue)) {
            process.stdout.write('\x1b[2K\r');
            return attempt;
        }
        process.stdout.write(`\rFailed check ${attempt}/${retries}`);
        if (attempt < retries) await delay(retryDelay);
    }
    return undefined;
};

/**
 * Checks if a computed value is equal to a target value, with retries and delays.
 *
 * @param {Function} computeFn - The function to compute the value.
 * @param {Array} [funcArguments=[]] - The arguments to pass to `computeFn`.
 * @param {*} targetValue - The value to compare against.
 * @param {number} [retryDelay=10000] - The delay between each retry in milliseconds.
 * @param {number} [retries=3] - The number of times to retry the check.
 * @returns {Promise<boolean>} - Returns `true` if the value matches; otherwise, fails the test.
 */
const checkEqualWithRetries = async (computeFn, funcArguments = [], targetValue, valueName = 'Value', retryDelay = 10000, retries = 3) => {
    const result = await _checkConditionWithRetries(value => value === targetValue, computeFn, funcArguments, retryDelay, retries);
    if (result) return result;
    expect.fail(`${valueName} did not match target value (${targetValue}) after ${retries} attempts.`);
};

/**
 * Checks if a computed value is within a specified range, with retries and delays.
 *
 * @param {Function} computeFn - The function to compute the value.
 * @param {Array} [funcArguments=[]] - The arguments to pass to `computeFn`.
 * @param {number} min - The minimum value of the range.
 * @param {number} max - The maximum value of the range.
 * @param {number} [retryDelay=10000] - The delay between each retry in milliseconds.
 * @param {number} [retries=3] - The number of times to retry the check.
 * @returns {Promise<boolean>} - Returns `true` if the value is within range; otherwise, fails the test.
 */
const checkInRangeWithRetries = async (computeFn, funcArguments = [], min, max, valueName = 'Value', retryDelay = 10000, retries = 3) => {
    const result = await _checkConditionWithRetries(value => value >= min && value <= max, computeFn, funcArguments, retryDelay, retries);
    if (result) return result;
    expect.fail(`${valueName} did not fall within range [${min}, ${max}] after ${retries} attempts.`);
};


module.exports = {
    write_log,
    intervalDelay,
    checkEqualWithRetries,
    checkInRangeWithRetries
}