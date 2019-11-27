const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')
const {
    testData1,
    testData2
} = require(path.join(process.cwd(), 'config/index')).tid_30
const {
    storePipeline,
    runStored,
    deletePipeline,
    deconstructTestData,
    checkResults
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
        await checkResults(res, 200, 'completed', d, false)


    }).timeout(5000000);

    it('should not run', async () => {
        const name = "pipelineName"

        testData1.descriptor.name = name

        const d = deconstructTestData(testData1)

        //run the pipeline
        const res = await runStored(d.inputData)
        await delay(5 * 1000)

        //assertions
        expect(res.status).to.eql(404)
        expect(res.body.error).to.have.property('message')
        expect(res.body.error.message).to.include('Not Found')

    }).timeout(5000000);

    it('should not run after deleting the pipeline', async () => {
        const name = "pipelineName"

        await deletePipeline(name)

        testData2.descriptor.name = name

        const d = deconstructTestData(testData2)
        const res = await runStored(d.inputData)

        //assertions
        expect(res.status).to.eql(404)
        expect(res.body.error).to.have.property('message')
        expect(res.body.error.message).to.include('Not Found')
    }).timeout(5000000);


});