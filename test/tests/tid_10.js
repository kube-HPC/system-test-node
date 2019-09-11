const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')

const {
    getResult
} = require(path.join(process.cwd(), 'utils/results'))
const {
    testData1,
    testData2
} = require(path.join(process.cwd(), 'config/index')).tid_10
const logger = require(path.join(process.cwd(), 'utils/logger'))

const {
    storePipeline,
    runStored,
    deletePipeline,
    deconstructTestData,
    checkResults
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))
chai.use(chaiHttp);



describe('Part or all of the inputs of algorithm are taken from the pipeline\'s request', () => {
    it('should return result 24', async () => {

        //set test data to testData1
        const d = deconstructTestData(testData1)

        //store pipeline
        await storePipeline(d.pipeline)

        //run the pipeline
        const res = await runStored(d.inputData)

        await checkResults(res, 200, 'completed', d, true)

    }).timeout(1000 * 60 * 5);

    it('should return result 18', async () => {

        //set test data to testData2
        const d = deconstructTestData(testData2)

        //store pipeline
        await storePipeline(d.pipeline)

        //run the pipeline
        const res = await runStored(d.inputData)

        checkResults(res, 200, 'completed', d, true)

    }).timeout(5000000);

});