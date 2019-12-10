const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')
const assertArrays = require('chai-arrays');


const {
    getPodsRunning
} = require(path.join(process.cwd(), 'utils/results'))
const {   
    testData2
} = require(path.join(process.cwd(), 'config/index')).tid_51
const logger = require(path.join(process.cwd(), 'utils/logger'))

const {
    getPiplineNodes,
    getPipelineStatus,
    storePipeline,
    runStored,
    deconstructTestData,
    checkResults
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))



  chai.use(chaiHttp);
  chai.use(assertArrays);
  
describe('TID-114- not existing jobId', () => {
    it('job id ', async () => {

        //set test data to testData1
        const d = deconstructTestData(testData2)
       
        //store pipeline Prime
        await storePipeline(d)
       
        //run the pipeline Prime
        const res = await runStored(d)
    
        const existingJobIdStatus= await getPipelineStatus(res.body.jobId)
        const nonExistingJobIdStatus= await getPipelineStatus(res.body.jobId+"nonexist")

        expect(existingJobIdStatus.status).to.equal(200)
        expect(nonExistingJobIdStatus.status).to.equal(404)   
       // existingJobIdStatus.should.have.status(200)
       // nonExistingJobIdStatus.should.have.status(404)
        await checkResults(res, 200, 'completed', d, true)
        await deletePipeline(d.name)
       

    }).timeout(1000 * 60 * 5);

    // it('something TID 120',async ()=>{
    //     const d = deconstructTestData(testData2)
       
    //     //store pipeline Prime
    //     await storePipeline(d)
       
    //     //run the pipeline Prime
    //     const res = await runStored(d)

    //     const nodes = await getPiplineNodes(res.body.jobId)

    //     const KubernetesClient = require('@hkube/kubernetes-client').Client;
    //     const config = {
    //         isLocal: false,
    //         namespace: 'default',
    //     };
    //     const client = new KubernetesClient(config);
    //    const del = await client.pods.delete(nodes.body[2]);

    // }).timeout(1000 * 60 * 5);


});