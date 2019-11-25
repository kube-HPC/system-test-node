const chai = require('chai');
const expect = chai.expect;
const should = chai.should();

const chaiHttp = require('chai-http');
const path = require('path');
const config = require(path.join(process.cwd(), 'config/config'))
const {
    getStatusall,
    getResult
} = require(path.join(process.cwd(), 'utils/results'))
const {
    testData1,
    testData2
} = require(path.join(process.cwd(), 'config/index')).subPipeline;

const {
    storePipeline,
    deletePipeline

} = require(path.join(process.cwd(), 'utils/pipelineUtils'))


const fse = require('fs-extra')

const logger = require(path.join(process.cwd(), 'utils/logger'))
chai.use(chaiHttp);

//TODO: refactor this code

describe('sub pipeline', () => {

    before('store pipeline main pipeline', async () => {
        const pipeline = testData1.descriptor;
        const res = await storePipeline(pipeline)

        const pipeline2 = testData2.descriptor;
        const res2 = await storePipeline(pipeline2)
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

        await deletePipeline(testData1.descriptor.name)
        await deletePipeline(testData2.descriptor.name)

        expect(result.data).to.eql(testData1.data)

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