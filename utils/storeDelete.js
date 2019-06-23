const config = require('../config/config')
const chai = require('chai');
const chaiHttp = require('chai-http');
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


module.exports = {
    storePipeline,
    deletePipeline,
    execPipeline
}