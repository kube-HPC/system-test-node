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

    }).timeout(1000 * 60 * 5);


    it('should run the pipeline twice', async () => {

        const d = deconstructTestData(testData1)

        await storePipeline(d.pipeline)


        const resA = await runStored(d.inputData)
        await checkResults(resA, 200, 'completed', d, false)



        const resB = await runStored(d.inputData)
        const jobId = resB.body.jobId
        await delay(30 * 1000)

        let runningPods = await getPodsRunning(jobId)
        logger.info(`getting running pods on id ${jobId}`)
        expect(runningPods.body).to.not.be.empty


        await checkResults(resB, 200, 'completed', d, true)


    }).timeout(1000 * 60 * 5);

});