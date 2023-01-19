const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')

const {
    getPodsRunning
} = require('../../../utils/results')
const {
    testData1
} = require(path.join(process.cwd(), 'config/index')).tid_140
const logger = require('../../../utils/logger')

const {
    getResult
} = require('../../../utils/results')
const {
    storePipeline,
    runStored,
    deconstructTestData,
} = require('../../../utils/pipelineUtils')
chai.use(chaiHttp);

const {
    jnk,
    getLogByJobId
} = require('../../../utils/elasticsearch')
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe('HKUBE Logs elasticsearch,', () => {


    it(" TID-140 algorithm writes internal logs to Hkube logs", async () => {
        //set test data to testData1
        const d = deconstructTestData(testData1)

        //store pipeline evalwait
        await storePipeline(d)

        //run the pipeline evalwait
        const res = await runStored(d)
        const jobId = res.body.jobId

        const result = await getResult(jobId, 200)

        await delay(20000);
        const log = await getLogByJobId(jobId)
        let a = log.hits.hits.filter(obj => obj._source.message.includes("im writing log"))
        expect(a).to.have.lengthOf.greaterThan(0)

    }).timeout(1000 * 60 * 5);

    it(" TID_120 pipeline events in system log of Hkube (git 94 95 96 )", async () => {
        //set test data to testData1
        const d = deconstructTestData(testData1)

        //store pipeline evalwait
        await storePipeline(d)

        //run the pipeline evalwait
        const res = await runStored(d)
        const jobId = res.body.jobId

        const result = await getResult(jobId, 200)
        //result.status.should.equal('completed')
        await delay(20000);

        const log = await getLogByJobId(jobId)

        let a = log.hits.hits.filter(obj => obj._source.message.includes("job-completed"))
        expect(a).to.have.lengthOf.greaterThan(0)
        let b = log.hits.hits.filter(obj => obj._source.message.includes("pipeline started"))
        expect(b).to.have.lengthOf.greaterThan(0)
    }).timeout(1000 * 60 * 5);


});