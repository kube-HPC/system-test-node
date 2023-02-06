const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const config = require(path.join(process.cwd(), 'config/config'))
const {
    getResult
} = require('../../../utils/results')
const {
    testData1
} = require(path.join(process.cwd(), 'config/index')).tid_50

const {
    stopPipeline,
    storePipeline,
    runStored,
    deconstructTestData,
    deletePipeline,
    checkResults
} = require('../../../utils/pipelineUtils')

const logger = require('../../../utils/logger')
const delay = require('delay');

chai.use(chaiHttp);


describe('stop pipeline while its runing', () => {

    it('should stop the pipeline while running (git 42)', async () => {
        const d = deconstructTestData(testData1)

        d.inputData.flowInput = {
            range: 1,
            time: 60000
        }

        const a = await storePipeline(d.pipeline)
        const res = await runStored(d.inputData)

        const jobId = res.body.jobId

        await delay(10000)


        const stop = await stopPipeline(jobId)
        logger.info(JSON.stringify(stop))

        expect(stop.status).to.eql(200)

        const stop2 = await stopPipeline(jobId)
        expect(stop2.status).to.eql(400)
        expect(stop2.body).to.have.property('error')
        logger.error(`stop2: ${stop2.body.error}`)
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


        await deletePipeline(d.name)

    }).timeout(5000000);




});