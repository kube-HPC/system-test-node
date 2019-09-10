const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const chaiHttp = require('chai-http');
const path = require('path')
const config = require(path.join(process.cwd(), 'config/config'))
const {
    getResult,
    getPodsRunning
} = require(path.join(process.cwd(), 'utils/results'));
const {
    testData1
} = require(path.join(process.cwd(), 'config/index')).tid_31
const logger = require(path.join(process.cwd(), 'utils/logger'))
const delay = require('delay');
chai.use(chaiHttp);



describe('Part or all of the inputs of algorithm are taken from the pipeline\'s request', () => {
    before('store pipeline eval-dynamic', async () => {
        const pipeline = testData1.descriptor;
        const res1 = await chai.request(config.apiServerUrl)
            .post('/store/pipelines')
            .send(pipeline);

        // logger.info(`executing eval dynamic pipeline`)
        // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
        // res1.should.have.status(201);
    })

    it('should run the pipeline twice', async () => {
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

        const res1 = await chai.request(config.apiServerUrl)
            .post('/exec/stored')
            .send(body)

        res1.should.have.status(200);
        res1.body.should.have.property('jobId');
        const jobId1 = res1.body.jobId;

        await delay(30000)

        let runningPods = await getPodsRunning(jobId1)
        logger.info(`getting running pods on id ${jobId}`)
        expect(runningPods.body).to.not.be.empty


        const result = await getResult(jobId, 200);
        if ('error' in result) {
            process.stdout.write(result.error)

        }

        logger.info(`getting results from execution`)
        logger.info(`${res.status} ${JSON.stringify(res.body)}`)

        // expect(result.data).to.eql(testData1.data)
        expect(result.status).to.eql('completed')
        expect(result).to.not.have.property('error')


    }).timeout(5000000);

    after('delete stored pipeline eval-dynamic', async () => {
        const name = testData1.descriptor.name;
        const res1 = await chai.request(config.apiServerUrl)
            .delete(`/store/pipelines/${name}`)

        // logger.info(`deleting pipeline addmult`)
        // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
        res1.should.have.status(200);
    })

});