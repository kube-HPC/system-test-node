const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')

const {
    getPodsRunning
} = require(path.join(process.cwd(), 'utils/results'))
const {
    testData2
} = require(path.join(process.cwd(), 'config/index')).tid_70
const logger = require(path.join(process.cwd(), 'utils/logger'))
const {
    getDriverIdByJobId
} = require(path.join(process.cwd(), 'utils/socketGet'))

const {
    client
} = require(path.join(process.cwd(), 'utils/kubtry'))

const {
    getResult
} = require(path.join(process.cwd(), 'utils/results'))
const {
    getPiplineNodes,   
    storePipeline,
    runStored,
    deconstructTestData,
    runStoredAndWaitForResults
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))
chai.use(chaiHttp);

const {
    getLogByJobId,
    waitForLog} = require(path.join(process.cwd(), 'utils/elasticsearch'))
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

describe('TID-115- the maximum retries for execution of failed algorithm exceeded,', () => {
    it('kill algorithm  ', async () => {

        //set test data to testData1
        const d = deconstructTestData(testData2)
       
        //store pipeline evalwait
        await storePipeline(d)
       
        //run the pipeline evalwait
        const res = await runStored(d)
       
        await sleep(2000)
        const jobId = res.body.jobId
        console.log("jobid - "+jobId)
        let deletedPod=""
        let z=0
        do {            
            await delay(2000)
            const nodes = await getPiplineNodes(jobId)   
           
            const podName = nodes.body[0]         
            if(typeof podName !== "undefined" && deletedPod !== podName)
                {
                    z++
                    console.log("z="+z)                                   
                    const pod = await client.api.v1.namespaces('default').pods(podName).delete();
                    deletedPod = podName;                                       
                    await delay(20000);                                                                         
                }    
        }
        while (z < 4);
       
        const result = await getResult(jobId, 200)
        await delay(5000);
        const log = await getLogByJobId(jobId)
        console.log(result.status)
        console.log(result.error)
        expect(result.status).to.equal("failed")
        expect(result.error).to.contain("is in CrashLoopBackOff, attempts:")
    }).timeout(1000 * 60 * 5);


    
    it(" TID_120 pipeline events in system log of Hkube",async ()=>{
         //set test data to testData1
         const d = deconstructTestData(testData2)
       
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