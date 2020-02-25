const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

chai.use(chaiHttp);
const path = require('path')
const config = require(path.join(process.cwd(), 'config/config'))
const {
    write_log
} = require(path.join(process.cwd(), 'utils/misc_utils'))

const {
    getResult
} = require(path.join(process.cwd(), 'utils/results'))

const {
    storeAlgorithm,
    logResult
} = require(path.join(process.cwd(), 'utils/algorithmUtils'))

const getPiplineNodes = async (id) => {
    const res = await chai.request(config.podsApiUrl)
        .get(`/${id}`)
    logResult(res, 'PipelineUtils getPipeline')
    return res
}

const getPipeline = async (name) => {

    const res = await chai.request(config.apiServerUrl)
        .get(`/store/pipelines/${name}`)
    logResult(res, 'PipelineUtils getPipeline')
    return res
}

const getAllPipeline = async () => {

    const res = await chai.request(config.apiServerUrl)
        .get(`/store/pipelines/`)
    logResult(res, 'PipelineUtils getPipeline')
    return res
}

const getPipelineStatus = async (id) => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/exec/status/${id}`)
    logResult(res, 'PipelineUtils getPipelineStatus')
    return res
}

const storePipeline = async (pipeObj) => {

    let pipeline = pipeObj
    let res
    if (typeof pipeline != 'string') {
        if ('pipeline' in pipeline) {
            pipeline = pipeline.pipeline
        }
        res = await storePipelineWithDescriptor(pipeline)
    } else {
        res = await storeNewPipeLine(pipeline)
    }
    logResult(res, 'PipelineUtils storePipeline')
    return res
}
const putStorePipelineWithDescriptor = async (descriptor) => {
    const res = await chai.request(config.apiServerUrl)
        .put('/store/pipelines')
        .send(descriptor);
    logResult(res, 'PipelineUtils putStorePipelineWithDescriptor')
    return res
}

const storePipelineWithDescriptor = async (descriptor) => {
    const res = await chai.request(config.apiServerUrl)
        .post('/store/pipelines')
        .send(descriptor);
    logResult(res, 'PipelineUtils storePipelineWithDescriptor')
    return res
}

const storeNewPipeLine = async (name) => {
    const pipeline = await getPipeline(name)
    if (pipeline.status === 404) {
        write_log("pipe was not found")
        const {
            pipe
        } = require(path.join(process.cwd(), `additionalFiles/defaults/pipelines/${name}`))

        const array = pipe.nodes.map(async (element) => {
            const algName = element.algorithmName
            storeAlgorithm(algName)
        })
        await Promise.all(array);
        const res1 = await chai.request(config.apiServerUrl)
            .post('/store/pipelines')
            .send(pipe);
        logResult(res1, 'storeNewPipeLine')
        return res1
    }

    return pipeline


}


const deletePipeline = async (pipelineName) => {

    let name = pipelineName
    if (typeof name != 'string') {

        if ('name' in pipelineName) {
            name = pipelineName.name
        }
    }

    const res = await chai.request(config.apiServerUrl)
        .delete(`/store/pipelines/${name}`)
    logResult(res, 'PipelineUtils deletePipeline')
    return res
}

const runStored = async (descriptor) => {

    let body = descriptor

    if (typeof body != 'string') {
        if ("inputData" in descriptor) {
            body = descriptor.inputData
        }
    } else {
        const name = body
        body = {
            name
        }
    }
    const res = await chai.request(config.apiServerUrl)
        .post('/exec/stored')
        .send(body)
    logResult(res, 'PipelineUtils runStored')
    return res
}

const runRaw = async (body) => {
    const res = await chai.request(config.apiServerUrl)
        .post('/exec/raw')
        .send(body)
    logResult(res, 'PipelineUtils runRaw')
    return res
}

const resumePipeline = async (jobid) => {
    let body = {
        jobId: jobid
    }

    const res = await chai.request(config.apiServerUrl)
        .post('/exec/resume')
        .send(body)
    logResult(res, 'PipelineUtils resumePipeline')
    return res
}
const getExecPipeline = async (jobId)=>{
    const res = await chai.request(config.apiServerUrl)
    .get(`/exec/pipelines/${jobId}`)
    logResult(res, 'PipelineUtils getExecPipeline')
return res
}

const pausePipeline = async (jobid) => {
    let body = {
        jobId: jobid
    }

    const res = await chai.request(config.apiServerUrl)
        .post('/exec/pause')
        .send(body)
    logResult(res, 'PipelineUtils pausePipeline')
    return res
}

const runStoredAndWaitForResults = async (pipe) => {
    const res = await runStored(pipe)
    const jobId = res.body.jobId
    write_log(jobId)
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
    // expect(result).to.not.have.property('error')


    if (shouldDeletePipeline === true) {
        //delete the pipeline 
        await deletePipeline(testData.name)
    }
}

const stopPipeline = async (jobid) => {
    const data = {
        jobId: jobid,
        reason: "from test"
    }

    const res = await chai.request(config.apiServerUrl)
        .post('/exec/stop')
        .send(data)

    logResult(res, 'PipelineUtils pausePipeline')
    return res
}

const exceCachPipeline = async (jobId,nodeName)=>{
    const data = {
        jobId: jobId,
        nodeName: nodeName
    }

    const res = await chai.request(config.apiServerUrl)
        .post('/exec/caching')
        .send(data)
    logResult(res, 'PipelineUtils exceCachPipeline')
    return res
}

const getPipelineResultsByName = async (name,limit=5)=>{

    const res = await chai.request(config.apiServerUrl)
    .get(`/pipelines/results?name=${name}&limit=${limit}`)

    return res

}

const getPipelinestatusByName = async (name,limit=5)=>{

    const res = await chai.request(config.apiServerUrl)
    .get(`/pipelines/status?name=${name}&limit=${limit}`)

    return res

}
const pipelineRandomName = (length)=>{
    
        
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    
    return result;
}


module.exports = {
    pipelineRandomName,
    putStorePipelineWithDescriptor,
    getExecPipeline,
    getPiplineNodes,
    getPipeline,
    getAllPipeline,
    getPipelineStatus,
    storePipeline,
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
    getPipelinestatusByName 

}