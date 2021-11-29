const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')

const {generateRandomJson }= require(path.join(process.cwd(), 'utils/generateRandomJson'))
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
describe('big flowinput',()=>{
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+=~';
    var charactersLength = characters.length;
    var result           = '';
    for ( var i = 0; i < 2000000; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    const simple = {   
        name: "test-input",
        flowInput: {
            files:{ link: "",
            link1:""}
           
          }
    }

    const simple1 = {   
        name: "simple",
        flowInput: {
            files:{ link: "",
            link1:""}
           
          }
    }
    const java = {   
        name: "java-batch",
        flowInput: { inp :""
          
           
          }
    }
    const largeData = {   
        name: "large-data",
        flowInput: {
            "size": 100000,
            "batch": 2
        },
    }

    it("start test-input",async ()=>{
        const hh = generateRandomJson(8)
        //console.log(hh)
        simple1.flowInput.files.link=hh
        simple1.flowInput.files.link1 =1//{"jnk":result}

        console.log(`flowInput length - ${JSON.stringify(simple1.flowInput).length}`);

        const jnk = await runStored(simple1)
        console.log(jnk.text)
    }).timeout(1000 * 60 * 60);

    it("start largeData",async ()=>{
        const hh = generateRandomJson(5)
        //console.log(hh)
     
        const jnk = await runStored(largeData)
        console.log(jnk.text)
    }).timeout(1000 * 60 * 60);



    it("start java-batch",async ()=>{
        const hh = generateRandomJson(5)
        java.flowInput.inp= result
      
        const jnk = await runStored(java)
        console.log(jnk.text)
       
    }).timeout(1000 * 60 * 60);
})

describe('TID-181- increasing batch sizes and parallel requests', () => {
    it('100 batch 1 thread 15 seconds', async () => {
       
        await executeJob(100,15000,1)
        
    }).timeout(1000 * 60 * 60);

    it('500 batch 1 thread 15 seconds', async () => {
       
        await executeJob(500,15000,1)
        
    }).timeout(1000 * 60 * 60);


    it('1000 batch 1 thread 15 seconds', async () => {
       
        await executeJob(1000,15000,1)
        
    }).timeout(1000 * 60 * 60);



    it('100 batch 4 thread 15 seconds', async () => {
       
        await executeJob(100,15000,4)
        
    }).timeout(1000 * 60 * 60);

    it('500 batch 4 thread 15 seconds', async () => {
       
        await executeJob(500,15000,4)
        
    }).timeout(1000 * 60 * 60);


    it('1000 batch 4 thread 15 seconds', async () => {
       
        await executeJob(1000,15000,10)
        
    }).timeout(1000 * 60 * 60);

   



});