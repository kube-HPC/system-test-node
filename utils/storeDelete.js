const path = require('path')
const config = require(path.join(process.cwd(), 'config/config'))
const chai = require('chai');
const chaiHttp = require('chai-http');
const {
    idGen,
    getStatusall
} = require(path.join(process.cwd(), 'results'))
const fse = require('fs-extra')
const logger = require(path.join(process.cwd(), 'logger'))

chai.use(chaiHttp);


const storePipeline = async (descriptor) => {
    const pipeline = descriptor;
    const res = await chai.request(config.apiServerUrl)
        .post('/store/pipelines')
        .send(pipeline);

    return res

    // logger.info(`executing addmult pipeline`)
    // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
    // res1.should.have.status(201);
}


const deletePipeline = async (pipelineName) => {

    const res = await chai.request(config.apiServerUrl)
        .delete(`/store/pipelines/${pipelineName}`)

    // logger.info(`deleting pipeline multadd`)
    // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
    return res
}


const execPipeline = async (pipelineName, pipelineData) => {
    const data = {
        name: pipelineName,
        ...pipelineData
    }
    const res = await chai.request(config.apiServerUrl)
        .post('/exec/stored')
        .send(data)

    return res.body.jobId
}


async function deleteAlgorithm(algName) {
    const res = await chai.request(config.apiServerUrl)
        .get(`/store/algorithms/${algName}`)

    if (res.statusCode === 200) {
        console.log(`algorithm ${algName} found, deleting it`)
        const del = await chai.request(config.apiServerUrl)
            .delete(`/store/algorithms/${algName}`)
        console.log(del.body)
    } else {
        console.log(`algorithm ${algName} not found`)
    }

    return
}

async function applyAlgorithm(code, algName, entry) {
    const data = {
        name: algName,
        env: 'python',
        cpu: 0.5,
        gpu: 0,
        mem: '512Mi',
        entryPoint: entry,
        minHotWorkers: 0,
        version: idGen()
    }

    const res = await chai.request(config.apiServerUrl)
        .post('/store/algorithms/apply')
        .field('payload', JSON.stringify(data))
        .attach('file', fse.readFileSync(code), entry)

    logger.info(JSON.stringify(res.body))

    res.should.have.status(200)
    const buildIdAlg = res.body.buildId
    const buildStatusAlg = await getStatusall(buildIdAlg, `/builds/status/`, 200, "completed", 1000 * 60 * 10)

    return buildStatusAlg
}


module.exports = {
    storePipeline,
    deletePipeline,
    execPipeline,
    deleteAlgorithm,
    applyAlgorithm
}