const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

chai.use(chaiHttp);
const path = require('path')
const config = require(path.join(process.cwd(), 'config/config'))
const logger = require(path.join(process.cwd(), 'utils/logger'))
const {
    getResult
} = require(path.join(process.cwd(), 'utils/results'))

const {
    storeNewAlgorithm
} = require(path.join(process.cwd(), 'utils/algorithimsUtils'))



//TODO: add logs to all functions


const getPipeline = async (name) => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/pipelines/status/stored/${name}`)

    return res
}

//FIXME: storePipeline and storeNewPipeLine should not be both only one should be
const storePipeline = async (descriptor) => {
    const pipeline = descriptor;
    const res = await chai.request(config.apiServerUrl)
        .post('/store/pipelines')
        .send(pipeline);
    return res
}

const storeNewPipeLine = async (name) => {

    const pipline = await getPipeline(name)
    if (pipline.status === 404) {
        console.log("pipe was not found")
        const {
            pipe
        } = require(path.join(process.cwd(), `additionalFiles/defaults/pipelines/${name}`.toString()))

        const array = pipe.nodes.map(async (element) => {
            const algName = element.algorithmName
            storeNewAlgorithm(algName)
        })
        await Promise.all(array);
        const res1 = await chai.request(config.apiServerUrl)
            .post('/store/pipelines')
            .send(pipe);

    }
    // const newPipline = await getPipeline(name)

}



const deletePipeline = async (pipelineName) => {
    const res = await chai.request(config.apiServerUrl)
        .delete(`/store/pipelines/${pipelineName}`)

    return res
}

const runStored = async (body) => {
    const res = await chai.request(config.apiServerUrl)
        .post('/exec/stored')
        .send(body)

    return res
}

const runRaw = async (body) => {
    const res = await chai.request(config.apiServerUrl)
        .post('/exec/raw')
        .send(body)

    return res
}

const runStoredAndWaitForResults = async (pipe) => {
    const res = await runStored(pipe)
    const jobId = res.body.jobId
    console.log(jobId)
    const result = await getResult(jobId, 200)
    return jobId
}

const deconstructTestData = (testData) => {
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

const checkResults = async (res, expectedStatusCode, expectedStatus, testData, shouldDeletePipeline = true) => {

    expect(res.status).to.eql(expectedStatusCode)
    expect(res.body).to.have.property('jobId')
    const jobId = res.body.jobId;


    const result = await getResult(jobId, expectedStatusCode);
    if ('error' in result) {
        process.stdout.write(result.error)
    }

    // logger.result('test 10')

    if (testData.data) {
        expect(result.data).to.eql(testData.data)
    }
    if (expectedStatus) {
        expect(result.status).to.eql(expectedStatus)
    }
    expect(result).to.not.have.property('error')


    if (shouldDeletePipeline === true) {
        //delete the pipeline 
        const res1 = await deletePipeline(testData.name)
        expect(res1.status).to.eql(expectedStatusCode)
    }
}


module.exports = {
    storePipeline,
    deletePipeline,
    runStored,
    deconstructTestData,
    checkResults,
    runStoredAndWaitForResults,
    getPipeline,
    storeNewPipeLine
}