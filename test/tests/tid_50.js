const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const chaiHttp = require('chai-http');
const config = require('../../config/config');
const { getResult } = require('../../utils/results');
const testData1 = require('../../pipelines/eval-dynamic')
const logger = require('../../utils/logger')
const delay = require('delay');

chai.use(chaiHttp);



describe('stop pipeline while its runing', () => {
    before('store pipeline eval dynamic', async () => {
        const pipeline = testData1.descriptor;
        const res1 = await chai.request(config.apiServerUrl)
            .post('/store/pipelines')
            .send(pipeline);

        logger.info(`executing addmult pipeline`)
        logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
        res1.should.have.status(201);
    })

    it('should stop the pipeline while running', async () => {
        const name = testData1.descriptor.name
        let inputData = {
            flowInput: {
                range: 1,
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

        await delay(10000)


        const stopInfo = {
            jobId: jobId,
            reason: "stop now"
        }

        const stop = await chai.request(config.apiServerUrl)
            .post('/exec/stop')
            .send(stopInfo)

        logger.info(JSON.stringify(stop))

        stop.should.have.status(200)

        const stop2 = await chai.request(config.apiServerUrl)
            .post('/exec/stop')
            .send(stopInfo)

        stop2.should.have.status(400)
        expect(stop2.body).to.have.property('error')
        logger.error (`stop2: ${stop2.body.error}`)
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


    }).timeout(5000000);


    after('delete stored pipeline eval dynamic', async () => {
        const name = testData1.descriptor.name;
        const res1 = await chai.request(config.apiServerUrl)
            .delete(`/store/pipelines/${name}`)

        logger.info(`deleting pipeline addmult`)
        logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
        res1.should.have.status(200);
    })

});