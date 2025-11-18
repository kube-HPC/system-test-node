const chai = require('chai');
const delay = require('delay');
const net = require('net');
const logger = require('../utils/logger')
const expect = chai.expect;
const config = require('../config/config');


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
    let computedValue;
    for (let attempt = 1; attempt <= retries; attempt++) {
        computedValue = await computeFn(...computeFuncArguments);
        if (conditionFn(computedValue)) {
            process.stdout.write('\x1b[2K\r');
            return { attempt, value: computedValue };
        }
        process.stdout.write(`\rFailed check ${attempt}/${retries}`);
        if (attempt < retries) await delay(retryDelay);
    }
    return computedValue;
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
    if (typeof result === 'object' && result !== null) return result;
    expect.fail(`${valueName}(${result}) did not match target value (${targetValue}) after ${retries} attempts.`);
};

/**
 * Checks if a computed value is within a specified range, with retries and delays.
 *
 * @param {Function} computeFn - The function to compute the value.
 * @param {Array} [funcArguments=[]] - The arguments to pass to `computeFn`.
 * @param {number} min - The minimum value of the range.
 * @param {number} max - The maximum value of the range.
 * @param {string} [valueName='Value'] - The name of the value being checked (for error messages).
 * @param {number} [retryDelay=10000] - The delay between each retry in milliseconds.
 * @param {number} [retries=3] - The number of times to retry the check.
 * @returns {Promise<boolean>} - Returns `true` if the value is within range; otherwise, fails the test.
 */
const checkInRangeWithRetries = async (computeFn, funcArguments = [], min, max, valueName = 'Value', retryDelay = 10000, retries = 3) => {
    const result = await _checkConditionWithRetries(value => value >= min && value <= max, computeFn, funcArguments, retryDelay, retries);
    if (typeof result === 'object' && result !== null) return result;
    let range = `did not fall within range [${min}, ${max}]`;
    if (min === -Infinity) range = `is not lower than or equal to ${max}`;
    else if (max === Infinity) range = `is not higher than or equal to ${min}`;
    expect.fail(`${valueName}(${result}) ${range} after ${retries} attempts.`);
};

/**
 * Login to the API server with retries.
 *
 * @param {string} username - The username for login (default dev from config).
 * @param {string} password - The password for login (default dev from config).
 * @param {number} attempts - Number of attempts (default 3)
 * @param {number} delayMs - Delay between retries in ms (default 10000)
 * @returns {Promise<string|undefined>}
 */
async function loginWithRetry(username = config.keycloakDevUser, password = config.keycloakDevPass) {
    const attempts = config.loginAttempts;
    const delayMs = config.loginDelayMs;
    if (!username || !password) {
        throw new Error('Username or password is undefined');
    }

    let lastError;

    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            // quick TCP check to fail fast on network issues (dns, port closed)
            try {
                const url = new URL(config.apiServerUrl);
                const host = url.hostname;
                const port = url.port || (url.protocol === 'https:' ? 443 : 80);
                const tcpOk = await new Promise((resolve) => {
                    const socket = new net.Socket();
                    let done = false;
                    socket.setTimeout(2000);
                    socket.once('connect', () => { done = true; socket.destroy(); resolve(true); });
                    socket.once('timeout', () => { if (!done) { done = true; socket.destroy(); resolve(false); } });
                    socket.once('error', () => { if (!done) { done = true; socket.destroy(); resolve(false); } });
                    socket.connect(port, host);
                });
                if (!tcpOk) {
                    throw new Error(`TCP connect to ${host}:${port} failed`);
                }
                console.log(`TCP connect to ${host}:${port} succeeded`);
            } catch (tcpErr) {
                // treat tcp failure as a network error to trigger retry
                throw tcpErr;
            }
            const response = await chai.request(config.apiServerUrl)
                .post('/auth/login')
                .send({ username, password });

            const msg = response.body?.error?.message;

            if (response.status === 200) {
                console.log('Login success');
                return response.body.data.access_token;
            }

            if (msg === 'Request failed with status code 401') {
                throw new Error(`Wrong credentials for ${username}!`);
            }

            if (msg === 'Request failed with status code 404') {
                console.log('Keycloak is disabled.');
                return undefined;
            }

            lastError = new Error(msg || 'Unknown login error');
        } catch (err) {
            lastError = err;

            // If it's a credential error, don't retry
            if (err.message && err.message.includes('Wrong credentials')) {
                throw err; // no retry
            }

            // Print more useful info for network errors (like ETIMEDOUT/ECONNREFUSED)
            console.log(`\nAttempt ${attempt} failed: ${err.message || err}\n`);
            if (err.stack) {
                console.log(err.stack);
            }

            if (attempt < attempts) {
                console.log(`Retrying in ${delayMs / 1000}s... (attempt ${attempt + 1}/${attempts})`);
                await new Promise(res => setTimeout(res, delayMs));
            }
        }
    }

    throw lastError;
}

module.exports = {
    write_log,
    intervalDelay,
    checkEqualWithRetries,
    checkInRangeWithRetries,
    loginWithRetry
}