const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const config = require(path.join(process.cwd(), 'config/config'));
const {
    getResult
} = require(path.join(process.cwd(), 'utils/results'));
const {
    testData1,
    testData2
} = require(path.join(process.cwd(), 'config/index')).tid_30
const {
    storePipeline,
    runStored,
    deletePipeline,
    deconstructTestData
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))

const logger = require(path.join(process.cwd(), 'utils/logger'))
chai.use(chaiHttp);



describe('pipelines will be executed using their name', () => {
    it('should return result 24', async () => {
        const name = "pipelineName"

        testData1.descriptor.name = name

        //set test data to testData1
        const d = deconstructTestData(testData1)

        //store pipeline
        await storePipeline(d.pipeline)

        //run the pipeline
        const res = await runStored(d.inputData)
        expect(res.status).to.eql(200)
        expect(res.body).to.have.property('jobId')
        const jobId = res.body.jobId;

        const result = await getResult(jobId, 200);
        if ('error' in result) {
            process.stdout.write(result.error)

        }

        logger.info(`getting results from execution`)
        logger.info(`${res.status} ${JSON.stringify(res.body)}`)

        expect(result.data).to.eql(d.data)
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
        res.body.error.message.should.include('Not Found')
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
        res.body.error.message.should.include('Not Found')
    }).timeout(5000000);


});