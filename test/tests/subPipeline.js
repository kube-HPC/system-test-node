const chai = require('chai');
const expect = chai.expect;
const should = chai.should();

const chaiHttp = require('chai-http');
const path = require('path');
const config = require('../../config/config');
const {
    getStatusall,
    getResult
} = require('../../utils/results');
const {
    testData1,
    testData2
} = require('../../config/index').subPipeline;

const {
    storePipeline,
    deletePipeline,
    execPipeline
} = require('../../utils/storeDelete')


const fse = require('fs-extra')

const logger = require('../../utils/logger')
chai.use(chaiHttp);



describe('should run a pipeline and execute sub pipeline after it', () => {

    it('store pipeline main pipeline', async () => {
        const pipeline = testData1.descriptor;
        const res = await storePipeline(pipeline)

        // logger.info(`executing addmult pipeline`)
        // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
        res.should.have.status(201);
    })


    it('store pipeline sub pipeline', async () => {
        const pipeline = testData2.descriptor;
        const res = await storePipeline(pipeline)

        // logger.info(`executing addmult pipeline`)
        // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
        res.should.have.status(201);
    })

    it('should run the main pipeline', async () => {
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
        // expect(result.data).to.eql(testData2.data)
        expect(result.status).to.eql('completed')


    }).timeout(5000000);


    // after('delete main pieline', async () => {
    //     const name = testData1.descriptor.name;
    //     const res1 = await chai.request(config.apiServerUrl)
    //         .delete(`/store/pipelines/${name}`)

    //     // logger.info(`deleting pipeline addmult`)
    //     // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
    //     res1.should.have.status(200);
    // })

    // after('delete sub pieline', async () => {
    //     const name = testData2.descriptor.name;
    //     const res1 = await chai.request(config.apiServerUrl)
    //         .delete(`/store/pipelines/${name}`)

    //     // logger.info(`deleting pipeline addmult`)
    //     // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
    //     res1.should.have.status(200);
    // })

})