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
    getResult
} = require(path.join(process.cwd(), 'utils/results'))
const {
    stopPipeline,
    deletePipeline,
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

describe('TID-70- pipeline state management (git 55)', () => {

    it('Received  status completed  ', async () => {

        //set test data to testData1
        const d = deconstructTestData(testData2)
       
       
        //store pipeline evalwait
        await storePipeline(d)
       
        //run the pipeline evalwait
        const res = await runStored(d)
        const jobId = res.body.jobId
        await getResult(jobId,200)
        const currentStatus= await getPipelineStatus(jobId)
           
        expect(currentStatus.body.status).to.have.equal("completed")             
        await deletePipeline(d.name)
       

    }).timeout(1000 * 60 * 5);
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
      
        //run the pipeline evalfail
        const res = await runStored(d)

        await checkResults(res, 200, 'failed', d, true)

        await deletePipeline(d.name)

    }).timeout(1000 * 60 * 5);

    it('Received  status stop  ', async () => {

        //set test data to testData1
        const d = deconstructTestData(testData2)
        
        //store pipeline evalwait
        await storePipeline(d)
       
        //run the pipeline evalwait
        const res = await runStored(d)
        const jobId = res.body.jobId
        
        await sleep(2000)
        await stopPipeline(jobId)      
        await sleep(2000)

        const currentStatus= await getPipelineStatus(jobId)
           
        expect(currentStatus.body.status).to.have.equal("stopped")
       
        
        await deletePipeline(d.name)
       

    }).timeout(1000 * 60 * 5);


    it('Received  status pending  ', async () => {


        //set test data to testData1
        const d = deconstructTestData(testData2)
        await deletePipeline(d.name)
        d.pipeline.options = {concurrentPipelines:{
            amount :1,
            rejectOnFailure:false
        }}
        //store pipeline evalwait
        await storePipeline(d)
        //run the pipeline evalwait  twice the second time will be pending till the first exection completed
        await runStored(d)
        
        const res = await runStored(d)
        const jobId = res.body.jobId
        const currentStatus= await getPipelineStatus(jobId)
        
        expect(currentStatus.body.status).to.have.equal("pending")
       
        
        await deletePipeline(d.name)
       

    }).timeout(1000 * 60 * 5);
   
});