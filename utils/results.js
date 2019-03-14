const chai = require('chai');
const expect = chai.expect;
const delay = require('delay');
const config = require('../config/config');
const logger = require('./logger')

const getResult = async (jobId, expectedStatus, timeout = 60 * 1000 * 10, interval = 5000) => {
    const start = Date.now();
    do {
        process.stdout.write('.')
        const res = await chai.request(config.apiServerUrl)
            .get(`/exec/results/${jobId}`);
        logger.info(`${res.status}, ${JSON.stringify(res.body)}`)
        if (res.status == expectedStatus) {
            return res.body;
        }
        await delay(interval);
    } while (Date.now() - start < timeout);
    expect.fail(`timeout exceeded trying to get ${expectedStatus} status in result for jobId ${jobId}`);
};

const getStatus = async (jobId, expectedCode, expectedStatus, timeout = 60 * 1000, interval = 1000) => {
    const start = Date.now();
    do {
        process.stdout.write('.')
        const res = await chai.request(config.apiServerUrl)
            .get(`/exec/status/${jobId}`);

        logger.info(`${res.status}, ${JSON.stringify(res.body)}`)
        if (res.status == expectedCode && res.body.status == expectedStatus) {
            return res.body;
        }
        await delay(interval);
    } while (Date.now() - start < timeout);
    expect.fail(`timeout exceeded trying to get ${expectedStatus} status for jobId ${jobId}`);
};


const getStates = async (jobId) => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/exec/status/${jobId}`);
    return res.data.states

}

const getPodsRunning = async (jobId) => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/hkube/monitor-server/pods/${jobId}`)
        logger.info(`${res.status}, ${JSON.stringify(res.body)}`)

    return res
}

const toString = (fun) => {
    return "" + fun
}



module.exports = {
    getResult,
    getStatus,
    getStates,
    getPodsRunning,
    toString
}

