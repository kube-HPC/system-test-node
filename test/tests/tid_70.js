const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')

const {
    getPodsRunning
} = require(path.join(process.cwd(), 'utils/results'))
const {
    testData1,
    testData2
} = require(path.join(process.cwd(), 'config/index')).tid_70
const logger = require(path.join(process.cwd(), 'utils/logger'))

const {
    getPipeline,
    getPipelineStatus,
    storePipeline,
    runStored,
    deconstructTestData,
    checkResults
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))
chai.use(chaiHttp);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

describe('TID-70- pipeline state management', () => {
    it('Received  status active  ', async () => {

        //set test data to testData1
        const d = deconstructTestData(testData2)
       
        //store pipeline evalwait
        await storePipeline(d)
       
        //run the pipeline evalwait
        const res = await runStored(d)
       
        await sleep(5000)
        const currentStatus= await getPipelineStatus(res.body.jobId)
           
        expect(currentStatus.body.status).to.have.equal("active")
       
        await checkResults(res, 200, 'completed', d, true)
        await deletePipeline(d.name)
       

    }).timeout(1000 * 60 * 5);

    it('Received  status failed  ', async () => {

        //set test data to testData1
        const d = deconstructTestData(testData1)
        
        //store pipeline evalfail
        await storePipeline(d)
      

        console.log(status)
        //run the pipeline evalfail
        const res = await runStored(d)

        await checkResults(res, 200, 'failed', d, true)

        await deletePipeline(d.name)

    }).timeout(1000 * 60 * 5);


});