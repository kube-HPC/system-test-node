const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const chaiHttp = require('chai-http');
const config = require('../../config/config');
const { getResult } = require('../../utils/results');
const testData1 = require('../../pipelines/addmult')
const testData2 = require('../../pipelines/multadd')
const logger = require('../../utils/logger')
chai.use(chaiHttp);



describe('pipelines will be executed using their name', () => {
    before('store pipeline pipeline', async () => {
        const name = "pipelineName"
        testData1.descriptor.name = name
        const pipeline = testData1.descriptor;
        const res1 = await chai.request(config.apiServerUrl)
            .post('/store/pipelines')
            .send(pipeline);

        logger.info(`executing pipeline pipeline`)
        logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
        res1.should.have.status(201);
    })

    it('should return result 24', async () => {
        const name = testData1.descriptor.name
        let body = testData1.input
        body.name = name
        const res = await chai.request(config.apiServerUrl)
            .post('/exec/stored')
            .send(body)
        // console.log (res)
        res.should.have.status(200);
        res.body.should.have.property('jobId');
        const jobId = res.body.jobId;


        const result = await getResult(jobId, 200);
        if ('error' in result) {
            process.stdout.write(result.error)

        }

        logger.info(`getting results from execution`)
        logger.info(`${res.status} ${JSON.stringify(res.body)}`)

        expect(result.data).to.eql(testData1.data)
        expect(result.status).to.eql('completed')
        expect(result).to.not.have.property('error')


    }).timeout(5000000);

    it('should not run', async () => {
        const name = "pipeline"
        let body = testData2.input
        body.name = name
        const res = await chai.request(config.apiServerUrl)
            .post('/exec/stored')
            .send(body)
        // console.log (res)

        logger.info(`getting results from execution`)
        logger.info(`${res.status} ${JSON.stringify(res.body)}`)
        res.should.have.status(404);
        res.body.error.should.have.property('message')
        res.body.error.message.should.include ('Not Found')
    }).timeout(5000000);

    it('delete stored pipeline pipeline', async () => {
        const name = testData1.descriptor.name;
        const res1 = await chai.request(config.apiServerUrl)
            .delete(`/store/pipelines/${name}`)

        logger.info(`deleting pipeline addmult`)
        logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
        res1.should.have.status(200);
    })

    it('should not run after deleting the pipeline', async () => {
        const name = "pipelineName"
        let body = testData2.input
        body.name = name
        const res = await chai.request(config.apiServerUrl)
            .post('/exec/stored')
            .send(body)
        // console.log (res)

        logger.info(`getting results from execution`)
        logger.info(`${res.status} ${JSON.stringify(res.body)}`)
        res.should.have.status(404);
        res.body.error.should.have.property('message')
        res.body.error.message.should.include ('Not Found')
    }).timeout(5000000);


});