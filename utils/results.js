const chai = require('chai');
const expect = chai.expect;
const delay = require('delay');
const path = require('path')
const config = require(path.join(process.cwd(), 'config/config'))

const logger = require(path.join(process.cwd(), 'logger'))

// chai.use(chaiHttp);


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
    const res = await chai.request(config.baseUrl)
        .get(`/hkube/monitor-server/pods/${jobId}`)
    logger.info(`${res.status}, ${JSON.stringify(res.body)}`)

    return res
}

const toString = (fun) => {
    return "" + fun
}

const getStatusall = async (id, url, expectedCode, expectedStatus, timeout = 60 * 1000, interval = 1000) => {
    const start = Date.now();
    do {
        process.stdout.write('.')
        const res = await chai.request(config.apiServerUrl)
            .get(`${url}/${id}`);

        logger.info(`${res.status}, ${JSON.stringify(res.body)}`)
        if (res.status == expectedCode && res.body.status == expectedStatus) {
            return res.body;
        }
        await delay(interval);
    } while (Date.now() - start < timeout);
    expect.fail(`timeout exceeded trying to get ${expectedStatus} status for jobId ${id}`);
};

const runRaw = async (time = 15000) => {
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
        .send(rawPipe)


    const jobId = res.body.jobId

    return jobId
}

const idGen = (MaxLen = 5) => {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    // const len = Math.floor(Math.random()*MaxLen)
    const len = 8
    const arr = []

    for (let i = 0; i < len; i++) {
        const current = Math.floor(Math.random() * nums.length)
        arr.push(nums[current])
    }

    return arr.join('.')
}



module.exports = {
    getResult,
    getStatus,
    getStates,
    getPodsRunning,
    toString,
    getStatusall,
    runRaw,
    idGen
}