const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')


const {
    testData1
} = require(path.join(process.cwd(), 'config/index')).tid_161

const {
    getDriverIdByJobId
} = require(path.join(process.cwd(), 'utils/socketGet'))

const {
    body,    
    deletePod,
    filterPodsByName,
    getPodNode
} = require(path.join(process.cwd(), 'utils/kubeCtl'))

const {
    getStates,
    getResult
} = require(path.join(process.cwd(), 'utils/results'))

// const KubernetesClient = require('@hkube/kubernetes-client').Client;
const {
    getPiplineNodes,
    storePipeline,
    runStored,
    deconstructTestData,
    runStoredAndWaitForResults
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))
const {
    write_log
} = require(path.join(process.cwd(), 'utils/misc_utils'))
chai.use(chaiHttp);

const {
    getLogByJobId,
    getLogByPodName
} = require(path.join(process.cwd(), 'utils/elasticsearch'))


const executeJob = async (batch ,time,threads)=>{

    const d = deconstructTestData(testData1)
    await storePipeline(d)
    const pipe = {   
        name: "eval-dynamic-160",
        flowInput: {
            range: batch,
            inputs:time}
    }
//   await runStoredAndWaitForResults(pipe)
    const runStoreArray = []
    for(i=0;i<threads;i++){
        runStoreArray.push( runStoredAndWaitForResults(pipe))
    }
   
    const results = await Promise.all(runStoreArray);
   // const j = await getResult(results[0])
   const validResults  = results.map(async (element) => {
        const a = await getResult(element,200);
        expect(a.status).to.be.equal('completed');
        return a;
    })
    const jobResults = await Promise.all(validResults);
    return jobResults;

}


describe('TID-181- increasing batch sizes and parallel requests', () => {
    it('100 batch 1 thread 15 seconds', async () => {
       
        await executeJob(100,15000,1)
        
    }).timeout(1000 * 60 * 5);

    it('500 batch 1 thread 15 seconds', async () => {
       
        await executeJob(500,15000,1)
        
    }).timeout(1000 * 60 * 5);


    it('1000 batch 1 thread 15 seconds', async () => {
       
        await executeJob(1000,15000,1)
        
    }).timeout(1000 * 60 * 5);



    it('100 batch 4 thread 15 seconds', async () => {
       
        await executeJob(100,15000,4)
        
    }).timeout(1000 * 60 * 5);

    it('500 batch 4 thread 15 seconds', async () => {
       
        await executeJob(500,15000,4)
        
    }).timeout(1000 * 60 * 5);


    it('1000 batch 4 thread 15 seconds', async () => {
       
        await executeJob(1000,15000,4)
        
    }).timeout(1000 * 60 * 5);

   



});