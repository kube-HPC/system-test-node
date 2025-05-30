const chai = require('chai');
const expect = chai.expect;
const delay = require('delay');
const path = require('path');
const config = require(path.join(process.cwd(), 'config/config'));
const logger = require('../utils/logger');
const { getWorkers } = require('../utils/socketGet');

// chai.use(chaiHttp);
const getJobResult = async (jobId, token = {}) => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/exec/results/${jobId}`)
        .set('Authorization', `Bearer ${token}`);
    logger.info(`${res.status}, ${JSON.stringify(res.body)}`);
    return res;
}

const getResult = async (jobId, expectedStatus, token = {}, timeout = 60 * 1000 * 10, interval = 5000) => {
    
    if (typeof jobId != 'string') {
        jobId = jobId.body.jobId;
    }

    const start = Date.now();
    let actualStatus = '';
    do {
        process.stdout.write(`\rWaiting for jobId: ${jobId} to get status: ${expectedStatus}, time passed: ${Date.now() - start}/${timeout} ms...`);
        const res = await getJobResult(jobId, token);
        actualStatus = res.status;
        if (actualStatus === expectedStatus) {
            console.log(`\njobId: ${jobId} has status: ${expectedStatus}`);
            return res.body;
        }
        await delay(interval);
    } while (Date.now() - start < timeout);
    expect.fail(`\ntimeout exceeded trying to get ${expectedStatus} status in result for jobId ${jobId}. Status is ${actualStatus}`);
};

const getJobIdStatus = async (jobId, token = {}) => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/exec/status/${jobId}`)
        .set('Authorization', `Bearer ${token}`);
    return res;
}

const getStatus = async (jobId, expectedCode, expectedStatus, token = {}, timeout = 60 * 1000 * 3, interval = 1000) => {
    const start = Date.now();
    let actualStatus = '';
    do {
        process.stdout.write(`\rWaiting for jobId: ${jobId} to get status: ${expectedStatus}, time passed: ${Date.now() - start}/${timeout} ms...`);
        const res = await chai.request(config.apiServerUrl)
            .get(`/exec/status/${jobId}`)
            .set('Authorization', `Bearer ${token}`);

        actualStatus = res.body.status;
        logger.info(`${res.status}, ${JSON.stringify(res.body)}`);
        if (res.status == expectedCode && actualStatus == expectedStatus) {
            console.log(`\njobId: ${jobId} has status: ${expectedStatus}`);
            return res.body;
        }
        await delay(interval);
    } while (Date.now() - start < timeout);
    expect.fail(`\ntimeout exceeded trying to get ${expectedStatus} status for jobId ${jobId}. Status is ${actualStatus}`);
};

const getStates = async (jobId) => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/exec/status/${jobId}`);
    return res.data.states;
}

const getJobIdsTree = async (jobId, token = {}) => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/exec/tree/${jobId}`)
        .set('Authorization', `Bearer ${token}`);
    return res;
}

const getPodsRunning = async (jobId, token) => {
    const data = await getWorkers(token);
    const worker = data.discovery.worker.filter(w => w.jobId === jobId).map(w => w.podName);
    logger.info(`worker : ,${jobId}, ${JSON.stringify(worker)}`);
    return worker;
}

const toString = (fun) => {
    return "" + fun;
}

// p6
const getStatusall = async (id, url, expectedCode, expectedStatus, token = {}, timeout = 60 * 1000 * 3, interval = 1000) => {
    const start = Date.now();
    let actualStatus = '';
    do {
        process.stdout.write(`\rWaiting for buildId: ${id} to get status: ${expectedStatus}, time passed: ${Date.now() - start}/${timeout} ms...`);
        const res = await chai.request(config.apiServerUrl)
            .get(`${url}/${id}`)
            .set('Authorization', `Bearer ${token}`);

        logger.info(`${res.status}, ${JSON.stringify(res.body)}`);
        actualStatus = res.body.status;
        if (res.status === expectedCode && actualStatus === expectedStatus) {
            console.log(`\nbuildId: ${id} has status: ${expectedStatus}`);
            return res.body;
        }
        if (res.body.status === "failed") {
            const failureReason = res.body.reason || JSON.stringify(res.body) || "unknown reason"; // Try to extract 'reason' field or log the entire body
            console.log(`\nbuildId: ${id} has status: failed, reason: ${failureReason}`);
            return res.body;
        }
        await delay(interval);
    } while (Date.now() - start < timeout);
    expect.fail(`\ntimeout exceeded trying to get ${expectedStatus} status for buildId ${id}, actual status: ${actualStatus}`);
};

const runRaw = async (token = {}, time = 15000) => {
    const rawPipe = {
        name: "rawPipe",
        nodes: [{
            nodeName: "node1",
            algorithmName: "eval-alg",
            input: [time],
            extraData: {
                code: [
                    "(input)=>{",
                    "return new Promise((resolve,reject)=>{setTimeout(()=>resolve(4),input[0])});}"
                ]
            }
        }]
    }

    const res = await chai.request(config.apiServerUrl)
        .post('/exec/raw')
        .set('Authorization', `Bearer ${token}`)
        .send(rawPipe);

    const jobId = res.body.jobId;
    return jobId;
}

const idGen = (MaxLen = 5) => {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    // const len = Math.floor(Math.random()*MaxLen)
    const len = 8;
    const arr = [];

    for (let i = 0; i < len; i++) {
        const current = Math.floor(Math.random() * nums.length);
        arr.push(nums[current]);
    }

    return arr.join('.');
}

const getRawGraph = async (jobId, token = {}) => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/graph/raw/${jobId}`)
        .set('Authorization', `Bearer ${token}`);
    logger.info(`${res.status}, ${JSON.stringify(res.body)}`);
    return res;
}

const getParsedGraph = async (jobId, token = {}) => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/graph/parsed/${jobId}`)
        .set('Authorization', `Bearer ${token}`);
    logger.info(`${res.status}, ${JSON.stringify(res.body)}`);
    return res;
}

const getCronResult = async (jobId, limit,token = {}, experimentName = "main") => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/cron/results/?name=${jobId}&experimentName=${experimentName}&limit=${limit}`)
        .set('Authorization', `Bearer ${token}`);
    logger.info(`${res.status}, ${JSON.stringify(res.body)}`);
    return res;
}

module.exports = {
    getResult,
    getStatus,
    getStates,
    getPodsRunning,
    toString,
    getStatusall,
    runRaw,
    idGen,
    getJobResult,
    getRawGraph,
    getParsedGraph,
    getCronResult,
    getJobIdsTree,
    getJobIdStatus
}
