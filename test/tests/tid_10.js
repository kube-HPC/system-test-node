const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const chaiHttp = require('chai-http');
const config = require('../../config/config');
const { getResult } = require('../../utils/results');
const { testData1, testData2 } = require('../../config/index').tid_10;
const logger = require('../../utils/logger')
chai.use(chaiHttp);



describe('Part or all of the inputs of algorithm are taken from the pipeline\'s request', () => {
    before('store pipeline addmult', async () => {
        const pipeline = testData1.descriptor;
        const res1 = await chai.request(config.apiServerUrl)
            .post('/store/pipelines')
            .send(pipeline);

        // logger.info(`executing addmult pipeline`)
        // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
        // res1.should.have.status(201);
    })

    before('store pipeline multadd', async () => {
        const pipeline = testData2.descriptor;
        const res1 = await chai.request(config.apiServerUrl)
            .post('/store/pipelines')
            .send(pipeline);

        // logger.info(`executing multadd pipeline`)
        // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
        // res1.should.have.status(201);
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

    it('should return result 18', async () => {
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


        const result = await getResult(jobId, 200);
        if ('error' in result) {
            process.stdout.write(result.error)

        }

        logger.info(`getting results from execution`)
        logger.info(`${res.status} ${JSON.stringify(res.body)}`)
        expect(result.data).to.eql(testData2.data)
        expect(result.status).to.eql('completed')


    }).timeout(5000000);

    after('delete stored pipeline addmult', async () => {
        const name = testData1.descriptor.name;
        const res1 = await chai.request(config.apiServerUrl)
            .delete(`/store/pipelines/${name}`)

        // logger.info(`deleting pipeline addmult`)
        // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
        res1.should.have.status(200);
    })
    after('delete stored pipeline multadd', async () => {
        const name = testData2.descriptor.name;
        const res1 = await chai.request(config.apiServerUrl)
            .delete(`/store/pipelines/${name}`)

        // logger.info(`deleting pipeline multadd`)
        // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
        res1.should.have.status(200);
    })
});