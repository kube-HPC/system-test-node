const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const config = require(path.join(process.cwd(), 'config/config'))
const {
    getResult
} = require(path.join(process.cwd(), 'utils/results'))
const {
    testData1
} = require(path.join(process.cwd(), 'config/index')).tid_50

const {
    storePipeline,
    runStored,
    deconstructTestData,
    deletePipeline,
    checkResults
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))

const logger = require(path.join(process.cwd(), 'utils/logger'))
const delay = require('delay');

chai.use(chaiHttp);


//TODO: refactor this code
describe('stop pipeline while its runing', () => {
    before('store pipeline eval dynamic', async () => {
        const pipeline = testData1.descriptor;
        const res1 = await chai.request(config.apiServerUrl)
            .post('/store/pipelines')
            .send(pipeline);

        // logger.info(`executing addmult pipeline`)
        // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
        // res1.should.have.status(201);
    })

    it('should stop the pipeline while running', async () => {
        const d = deconstructTestData(testData1)

        d.inputData.flowInput = {
            range: 1,
            time: 60000
        }

        await storePipeline(d.pipeline)
        const res = await runStored(d.inputData)

        const jobId = res.body.jobId

        await delay(10000)
        const stopInfo = {
            jobId: jobId,
            reason: "stop now"
        }

        const stop = await chai.request(config.apiServerUrl)
            .post('/exec/stop')
            .send(stopInfo)

        logger.info(JSON.stringify(stop))

        expect(stop.status).to.eql(200)

        const stop2 = await chai.request(config.apiServerUrl)
            .post('/exec/stop')
            .send(stopInfo)

        expect(stop2.status).to.eql(400)
        expect(stop2.body).to.have.property('error')
        logger.error(`stop2: ${stop2.body.error}`)
        expect(stop2.body.error.message).to.include('stopped')


        const result = await getResult(jobId, 200);
        if ('error' in result) {
            process.stdout.write(result.error)

        }

        logger.info(`getting results from execution`)
        logger.info(`${res.status} ${JSON.stringify(res.body)}`)

        // expect(result.data).to.eql(testData1.data)
        expect(result.status).to.eql('stopped')
        expect(result).to.not.have.property('error')


        await deletePipeline(d.name)

    }).timeout(5000000);




});