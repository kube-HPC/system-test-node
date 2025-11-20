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
const loginWithRetry = async (username = config.keycloakDevUser, password = config.keycloakDevPass) => {
    const attempts = config.loginAttempts;
    const delayMs = config.loginDelayMs;

    if (!username || !password) throw new Error('Username or password is undefined');

    let lastError;

    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            // quick TCP check to fail fast on network issues (dns, port closed)
            const url = new URL(config.apiServerUrl);
            const host = url.hostname;
            const port = url.port || (url.protocol === 'https:' ? 443 : 80);

            const tcpOk = await new Promise(resolve => {
                const socket = new net.Socket();
                let done = false;
                const onDone = (ok, info) => {
                    if (done) return;
                    // capture local address if available
                    try {
                        const local = socket.address();
                        if (local && typeof local === 'object') info.local = { address: local.address, port: local.port };
                    } catch (e) {
                        // ignore address capture errors
                    }
                    done = true;
                    try { socket.destroy(); } catch (e) {}
                    resolve({ ok, info });
                };

                socket.setTimeout(2000);
                socket.once('connect', () => onDone(true, { event: 'connect' }));
                socket.once('timeout', () => onDone(false, { event: 'timeout', message: `connect timed out after 2000ms` }));
                socket.once('error', (err) => onDone(false, { event: 'error', code: err.code, message: err.message, stack: err.stack }));
                try {
                    socket.connect(port, host);
                } catch (err) {
                    onDone(false, { event: 'error', code: err.code, message: err.message, stack: err.stack });
                }
            });

            if (!tcpOk.ok) {
                const info = tcpOk.info || {};
                const local = info.local ? `${info.local.address || '?'}:${info.local.port || '?'}` : 'unknown';
                console.log(`TCP connect to ${host}:${port} failed on attempt ${attempt}: ${info.event || 'unknown'} (local=${local})`);
                if (info.code) console.log(`TCP error code: ${info.code}`);
                if (info.message) console.log(`TCP message: ${info.message}`);
                if (info.stack) console.log(`TCP stack: ${info.stack}`);
                throw new Error(`TCP connect to ${host}:${port} failed: ${info.event || 'unknown'} ${info.code || ''} ${info.message || ''}`);
            }
            const local = tcpOk.info && tcpOk.info.local ? `${tcpOk.info.local.address || '?'}:${tcpOk.info.local.port || '?'}` : 'unknown';
            console.log(`TCP connect to ${host}:${port} succeeded (attempt ${attempt}, local=${local})`);

            // Actual login call using persistent agent
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
            console.log(`\nAttempt ${attempt} failed: ${err.message}\n`);

            if (err.message.includes('Wrong credentials')) throw err;

            if (attempt < attempts) {
                console.log(`Retrying in ${delayMs / 1000}s...`);
                await delay(delayMs);
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