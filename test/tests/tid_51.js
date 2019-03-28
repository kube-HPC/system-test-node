const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const assert = chai.assert;
const chaiHttp = require('chai-http');
const config = require('../../config/config');
const { getResult, getPodsRunning } = require('../../utils/results');
const { testData1, testData2 } = require('../../config/index').tid_51
const logger = require('../../utils/logger')
const delay = require('delay');

chai.use(chaiHttp);



describe('run pipelines in a queue', () => {
    before('store pipeline eval dynamic', async () => {
        const pipeline = testData1.descriptor;
        const res1 = await chai.request(config.apiServerUrl)
            .post('/store/pipelines')
            .send(pipeline);

        // logger.info(`executing addmult pipeline`)
        // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
        // res1.should.have.status(201);
    })

    before('store pipeline primes', async () => {
        const pipeline = testData2.descriptor;
        const res1 = await chai.request(config.apiServerUrl)
            .post('/store/pipelines')
            .send(pipeline);

        // logger.info(`executing addmult pipeline`)
        // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
        // res1.should.have.status(201);
    })



    it('should run the eval batch pipeline', async () => {
        const name = testData1.descriptor.name
        let inputData = {
            flowInput: {
                range: 60,
                time: 60000
            }
        }
        let body = inputData
        body.name = name
        const res = await chai.request(config.apiServerUrl)
            .post('/exec/stored')
            .send(body)
        // console.log (res)
        res.should.have.status(200);
        res.body.should.have.property('jobId');
        const jobId = res.body.jobId;

        await delay(25000)

        let runningPods = await getPodsRunning(jobId)
        logger.info(`getting running pods on id ${jobId}`)
        assert.isAtLeast(runningPods.body.length, 15, `the job ${jobId} expected to have at least 15 running pods while got ${runningPods.body.length}`)

        const result = await getResult(jobId, 200);
        if ('error' in result) {
            process.stdout.write(result.error)

        }

        logger.info(`getting results from execution`)
        logger.info(`${res.status} ${JSON.stringify(res.body)}`)

    }).timeout(5000000);




    it('should run the primes pipeline', async () => {
        const name = testData2.descriptor.name
        let body = testData2.input
        body.name = name
        const res = await chai.request(config.apiServerUrl)
            .post('/exec/stored')
            .send(body)
        // console.log (res)
        res.should.have.status(200);
        res.body.should.have.property('jobId');
        const jobId = res.body.jobId;


        await delay(35000)

        let runningPods = await getPodsRunning(jobId)
        logger.info(`getting running pods on id ${jobId}`)
        assert.isAtLeast(runningPods.body.length, 15, `the job ${jobId} expected to have at least 15 running pods while got ${runningPods.body.length}`)


        const result = await getResult(jobId, 200);
        if ('error' in result) {
            process.stdout.write(result.error)

        }

        logger.info(`getting results from execution`)
        logger.info(`${res.status} ${JSON.stringify(res.body)}`)

    }).timeout(5000000);


    after('delete stored pipeline eval dynamic', async () => {
        const name = testData1.descriptor.name;
        const res1 = await chai.request(config.apiServerUrl)
            .delete(`/store/pipelines/${name}`)

        // logger.info(`deleting pipeline addmult`)
        // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
        res1.should.have.status(200);
    })

    after('delete stored pipeline primes', async () => {
        const name = testData2.descriptor.name;
        const res1 = await chai.request(config.apiServerUrl)
            .delete(`/store/pipelines/${name}`)

        // logger.info(`deleting pipeline addmult`)
        // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
        res1.should.have.status(200);
    })

});