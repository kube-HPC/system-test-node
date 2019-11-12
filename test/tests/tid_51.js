const chai = require('chai');
const path = require('path')
const assert = chai.assert;
const chaiHttp = require('chai-http');
const {
    getResult,
    getPodsRunning
} = require(path.join(process.cwd(), 'utils/results'))
const {
    testData1,
    testData2
} = require(path.join(process.cwd(), 'config/index')).tid_51

const {
    storePipeline,
    runStored,
    deconstructTestData,
    deletePipeline
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))
const logger = require(path.join(process.cwd(), 'utils/logger'))
const delay = require('delay');

chai.use(chaiHttp);



describe('run pipelines in a queue', () => {
    it('should run the eval batch pipeline', async () => {
        let inputData = {
            flowInput: {
                range: 60,
                time: 60000
            }
        }

        testData1.inputData = inputData

        const d = deconstructTestData(testData1)

        await storePipeline(d.pipeline)

        const res = await runStored(d.inputData)

        const jobId = res.body.jobId;

        await delay(25000)

        let runningPods = await getPodsRunning(jobId)
        logger.info(`getting running pods on id ${jobId}`)
        assert.isAtLeast(runningPods.body.length, 15, `the job ${jobId} expected to have at least 15 running pods while got ${runningPods.body.length}`)

        const result = await getResult(jobId, 200);
        if ('error' in result) {
            process.stdout.write(result.error)
        }

        await deletePipeline(d.name)




        logger.info(`getting results from execution`)
        logger.info(`${res.status} ${JSON.stringify(res.body)}`)

    }).timeout(5000000);


    it('should run the primes pipeline', async () => {
        const d = deconstructTestData(testData2)


        await storePipeline(d.pipeline)

        const res = await runStored(d.inputData)

        const jobId = res.body.jobId;


        await delay(35000)

        let runningPods = await getPodsRunning(jobId)
        logger.info(`getting running pods on id ${jobId}`)
        assert.isAtLeast(runningPods.body.length, 15, `the job ${jobId} expected to have at least 15 running pods while got ${runningPods.body.length}`)


        const result = await getResult(jobId, 200);
        if ('error' in result) {
            process.stdout.write(result.error)

        }

        await deletePipeline(d.name)

        logger.info(`getting results from execution`)
        logger.info(`${res.status} ${JSON.stringify(res.body)}`)

    }).timeout(5000000);

});