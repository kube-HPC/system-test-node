const chai = require('chai');
const chaiHttp = require('chai-http');
const { getWorkers } = require('../utils/socketGet');

const expect = chai.expect;

chai.use(chaiHttp);
const path = require('path');
const config = require(path.join(process.cwd(), 'config/config'));

const {
    write_log
} = require('../utils/misc_utils');

const {
    getResult
} = require('../utils/results');

const {
    storeAlgorithm,
    logResult
} = require('../utils/algorithmUtils');

const getPiplineNodes = async (jobId, token) => {
    const data = await getWorkers(token);
    const res = data.discovery.worker.filter(w => w.jobId === jobId).map(w => w.podName);
    logger.info(`worker : ,${jobId}, ${JSON.stringify(worker)}`);

    logResult(res, 'PipelineUtils getPipeline');

    return res;
}

const getPipeline = async (name, token = {}) => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/store/pipelines/${name}`)
        .set('Authorization', `Bearer ${token}`);
    logResult(res, 'PipelineUtils getPipeline');
    return res;
}

const getAllPipeline = async () => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/store/pipelines/`)
    logResult(res, 'PipelineUtils getPipeline');
    return res;
}

const getPipelineStatus = async (id, token = {}) => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/exec/status/${id}`)
        .set('Authorization', `Bearer ${token}`);
    logResult(res, 'PipelineUtils getPipelineStatus');
    return res;
}

const getPipelineTriggerTree = async (pipelineName, token = {}) => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/pipelines/triggers/tree?name=${pipelineName}`)
        .set('Authorization', `Bearer ${token}`);
    logResult(res, 'PipelineUtils getPipelineTriggerTree');
    return res;
}

const storePipeline = async (pipeObj, token = {}, pipelineList = []) => { // pipelineList is dedicated for managing deletion of added tests.
    let pipeline = pipeObj;
    let res;
    if (typeof pipeline != 'string') {
        if ('pipeline' in pipeline) {
            pipeline = pipeline.pipeline;
        }
        res = await storePipelinesWithDescriptor(pipeline, token, pipelineList);
    } else {
        res = await storeNewPipeLine(pipeline, token);
        if (!pipelineList.includes(pipeline)) {
            pipelineList.push(pipeline);
        }
    }
    logResult(res, 'PipelineUtils storePipeline');
    return res;
}

const putStorePipelinesWithDescriptor = async (descriptor) => {
    const res = await chai.request(config.apiServerUrl)
        .put('/store/pipelines')
        .send(descriptor);
    logResult(res, 'PipelineUtils puStorePipelinesWithDescriptor');
    return res;
}

const storePipelinesWithDescriptor = async (descriptor, token = {}, pipelineList = []) => { // // pipelineList is dedicated for managing deletion of added tests.
    const res = await chai.request(config.apiServerUrl)
        .post('/store/pipelines')
        .set('Authorization', `Bearer ${token}`)
        .send(descriptor);
    logResult(res, 'PipelineUtils storePipelinesWithDescriptor');
    if (Array.isArray(res.body)) { 
        res.body.forEach(pipeline => { 
            if (pipeline.name && !pipelineList.includes(pipeline.name)) {
                pipelineList.push(pipeline.name);
            }
        });
    } else { 
        if (res.body.name && !pipelineList.includes(res.body.name)) {
            pipelineList.push(res.body.name);
        }
    }
    return res;
}

const storeOrUpdatePipelines= async (descriptor, token = {},  pipelineList = []) => {
    const res = await chai.request(config.apiServerUrl)
        .post('/store/pipelines?overwrite=true')
        .set('Authorization', `Bearer ${token}`)
        .send(descriptor);
    logResult(res, 'PipelineUtils storeOrUpdatePipelines');
    if (Array.isArray(res.body)) { 
        res.body.forEach(pipeline => { 
            if (!pipelineList.includes(pipeline.name)) {
                pipelineList.push(pipeline.name);
            }
        });
    } else { 
        if (res.body.name && !pipelineList.includes(res.body.name)) {
            pipelineList.push(res.body.name);
        }
    }
    return res;
}

const storeNewPipeLine = async (name, token = {}) => {
    const pipeline = await getPipeline(name, token);
    if (pipeline.status === 404) {
        write_log("pipe was not found");
        const {
            pipe
        } = require(path.join(process.cwd(), `additionalFiles/defaults/pipelines/${name}`));

        const array = pipe.nodes.map(async (element) => {
            const algName = element.algorithmName
            storeAlgorithm(algName, token);
        });
        await Promise.all(array);
        const res1 = await chai.request(config.apiServerUrl)
            .post('/store/pipelines')
            .set('Authorization', `Bearer ${token}`)
            .send(pipe);
        logResult(res1, 'storeNewPipeLine');
        return res1;
    }
    return pipeline;
}

const deletePipeline = async (pipelineName, token = {}) => {
    let name = pipelineName;
    if (typeof name != 'string') {
        if ('name' in pipelineName) {
            name = pipelineName.name;
        }
    }

    const res = await chai.request(config.apiServerUrl)
        .delete(`/store/pipelines/${name}`)
        .set('Authorization', `Bearer ${token}`);
    logResult(res, 'PipelineUtils deletePipeline');
    return res;
}

const runStored = async (descriptor, token = {}) => {
    let body = descriptor;
    if (typeof body != 'string') {
        if ("inputData" in descriptor) {
            body = descriptor.inputData;
        }
    } else {
        const name = body;
        body = {
            name
        }
    }
    const res = await chai.request(config.apiServerUrl)
        .post('/exec/stored')
        .set('Authorization', `Bearer ${token}`)
        .send(body);
    logResult(res, 'PipelineUtils runStored');
    return res;
}

const loadRunStored = async (data, token = {}) => {
    const res = await chai.request(config.apiServerUrl)
        .post('/exec/stored')
        .set('Authorization', `Bearer ${token}`)
        .send(data);
    return res;
}

const runRaw = async (body, token = {}) => {
    const res = await chai.request(config.apiServerUrl)
        .post('/exec/raw')
        .set('Authorization', `Bearer ${token}`)
        .send(body);
    logResult(res, 'PipelineUtils runRaw');
    return res;
}

const resumePipeline = async (jobid, token = {}) => {
    let body = {
        jobId: jobid
    }

    const res = await chai.request(config.apiServerUrl)
        .post('/exec/resume')
        .set('Authorization', `Bearer ${token}`)
        .send(body);
    logResult(res, 'PipelineUtils resumePipeline');
    return res;
}

const getExecPipeline = async (jobId, token = {}) => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/exec/pipelines/${jobId}`)
        .set('Authorization', `Bearer ${token}`);
    logResult(res, 'PipelineUtils getExecPipeline');
    return res;
}

const pausePipeline = async (jobid, token = {}) => {
    let body = {
        jobId: jobid
    }

    const res = await chai.request(config.apiServerUrl)
        .post('/exec/pause')
        .set('Authorization', `Bearer ${token}`)
        .send(body);
    logResult(res, 'PipelineUtils pausePipeline');
    return res;
}

const runStoredAndWaitForResults = async (pipe, token = {}) => {
    const res = await runStored(pipe, token);
    const jobId = res.body.jobId;
    write_log(jobId);
    const result = await getResult(jobId, 200, token);
    return jobId;
}

const deconstructTestData = (testDataOgr) => {
    const testData = Object.create(testDataOgr)
    return {
        pipeline: testData.descriptor,
        name: testData.descriptor.name,
        body: testData.input,
        data: testData.data,
        inputData: {
            name: testData.descriptor.name,
            flowInput: testData.input.flowInput
        }
    }
}

const checkResults = async (res, expectedStatusCode, expectedStatus, testData, token = {}, shouldDeletePipeline = true) => {
    expect(res.status).to.eql(expectedStatusCode);
    expect(res.body).to.have.property('jobId');
    const jobId = res.body.jobId;;

    const result = await getResult(jobId, expectedStatusCode, token);
    if (result.error) {
        process.stdout.write(result.error);
    }

    // logger.result('test 10')

    if (testData.data) {
        expect(result.data).to.eql(testData.data);
    }
    if (expectedStatus) {
        expect(result.status).to.eql(expectedStatus);
    }
    // expect(result).to.not.have.property('error')

    if (shouldDeletePipeline === true) {
        //delete the pipeline 
        await deletePipeline(testData.name);
    }
}

const stopPipeline = async (jobid, token = {}) => {
    const data = {
        jobId: jobid,
        reason: "from test"
    }

    const res = await chai.request(config.apiServerUrl)
        .post('/exec/stop')
        .set('Authorization', `Bearer ${token}`)
        .send(data);

    logResult(res, 'PipelineUtils pausePipeline');
    return res;
}

const exceRerun = async (jobId, token = {}) => {
    const data = {
        jobId: jobId,
    }

    const res = await chai.request(config.apiServerUrl)
        .post('/exec/rerun')
        .set('Authorization', `Bearer ${token}`)
        .send(data);
    logResult(res, 'PipelineUtils exceRerun');
    return res;
}

const exceCachPipeline = async (jobId, nodeName, token = {}) => {
    const data = {
        jobId: jobId,
        nodeName: nodeName
    }

    const res = await chai.request(config.apiServerUrl)
        .post('/exec/caching')
        .set('Authorization', `Bearer ${token}`)
        .send(data);
    logResult(res, 'PipelineUtils exceCachPipeline');
    return res;
}

const getPipelineResultsByName = async (name, limit = 5) => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/pipelines/results?name=${name}&limit=${limit}`);
    return res;
}

const getPipelinestatusByName = async (name, token = {}, limit = 5) => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/pipelines/status?name=${name}&limit=${limit}`)
        .set('Authorization', `Bearer ${token}`);
    return res;
}

const getPipelineVersion = async (name, token = {}, limit = 5) => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/versions/pipelines/${name}`)
        .set('Authorization', `Bearer ${token}`);
    return res;
}

const pipelineRandomName = (length) => {
    var result = '';
    var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const getPending = async () => {
    const res = await chai.request(config.apiServerUrl)
        .get('/exec/jobs?status=pending&raw=true');
    return res;
}

const getActive = async () => {
    const res = await chai.request(config.apiServerUrl)
        .get('/exec/jobs?status=active&raw=true');
    return res;
}

module.exports = {
    exceRerun,
    pipelineRandomName,
    putStorePipelinesWithDescriptor,
    getExecPipeline,
    getPiplineNodes,
    getPipeline,
    getAllPipeline,
    getPipelineStatus,
    storePipeline,
    storePipelinesWithDescriptor,
    storeOrUpdatePipelines,
    deletePipeline,
    runStored,
    deconstructTestData,
    checkResults,
    runStoredAndWaitForResults,
    runRaw,
    resumePipeline,
    pausePipeline,
    stopPipeline,
    exceCachPipeline,
    getPipelineResultsByName,
    getPipelinestatusByName,
    getPipelineTriggerTree,
    loadRunStored,
    getPending,
    getActive,
    getPipelineVersion
}
