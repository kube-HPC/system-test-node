const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')

const {
    getPodsRunning
} = require(path.join(process.cwd(), 'utils/results'))
const {
    testData1
} = require(path.join(process.cwd(), 'config/index')).tid_140
const logger = require(path.join(process.cwd(), 'utils/logger'))

const {
    getResult
} = require(path.join(process.cwd(), 'utils/results'))
const { 
    storePipeline,
    runStored,
    deconstructTestData,
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))
chai.use(chaiHttp);

const {
    getLogByJobId
    } = require(path.join(process.cwd(), 'utils/elasticsearch'))
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

describe('TID-140- algorithm writes internal logs to Hkube logs,', () => {
   
   
    it(" Writing internal algorithm information to the system log",async ()=>{
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



});