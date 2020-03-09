const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')

const config = require(path.join(process.cwd(), 'config/config'))

const {
    testData1,
    testData2,
    testData3,
    testData4
} = require(path.join(process.cwd(), 'config/index')).tid_310
const logger = require(path.join(process.cwd(), 'utils/logger'))

const {
    getJobResult,
    getResult
} = require(path.join(process.cwd(), 'utils/results'))

const {
    getAllPipeline,
    getPipeline,
    putStorePipelineWithDescriptor,
    deletePipeline,
    runStoredAndWaitForResults,
    storePipeline,
    runStored,
    runRaw,
    deconstructTestData,
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))
chai.use(chaiHttp);

const input = (a, b) => {
    return {
        name: "addmuldiv",
        flowInput: {
            addInput: a,
            multInput: b
        }

    }

}
//JSON.stringify(a)
// ,
// "options": {
//     "batchTolerance": 60,
//     "progressVerbosityLevel": "debug"
// }


const getRandomArry = (number) => {
    let result = []
    for (i = 0; i < number; i++) {
        let a = Math.floor(Math.random() * 101);
        let b = Math.floor(Math.random() * 101);
        result.push([a, b]);
    }
    return result;
}

describe('TID-310 - 360', ()=>{


describe('TID-310 raw vs stored', () => {


    it(" run stored", async () => {
        //set test data to testData1
        const d = deconstructTestData(testData1)
       
        //store pipeline addmuldiv
        const t =await storePipeline(d)
       
        const jobId = await runStoredAndWaitForResults(d)
        const results  = await getJobResult(jobId)
        expect(results.body.data[0].result).to.be.equal(24)
    }).timeout(1000 * 60 * 5);

    it(" run raw", async () => {
        //set test data to testData1
        const d = deconstructTestData(testData1)
       
        const raw = d.pipeline
        raw.flowInput = d.inputData.flowInput
        raw.name = "raw-"+d.name
        const res = await runRaw(raw)
        const jobId = res.body.jobId

      //  const jobId = await runStoredAndWaitForResults(d)
        const results  = await getResult(jobId,200)
        expect(results.data[0].result).to.be.equal(24)
    }).timeout(1000 * 60 * 5);

    it(" run stored with missing alg", async () => {
        
        //set test data to testData1
        const d = deconstructTestData(testData1)
        await deletePipeline(d.name)

        d.pipeline.nodes[0].algorithmName = d.pipeline.nodes[0].algorithmName+"not"
        //store pipeline addmuldiv
        const t =await storePipeline(d)
        //full message - "algorithm eval-algnot Not Found"
        expect(t.text).to.contain("not Not Found")
    }).timeout(1000 * 60 * 5);



});

describe('pipeline actions', () => {

    it(" TID-320 add the same pipeline twice", async () => {

        const d = deconstructTestData(testData4)
        const del320 = await deletePipeline(d.name)
        await delay(2000)
        const t =await storePipeline(d)
        const newNodeName  = d.pipeline.nodes[1].nodeName+"test1234"
        d.pipeline.nodes[1].nodeName = newNodeName
        const store = await putStorePipelineWithDescriptor(d.pipeline)
        await delay(2000)
        const pipeLine = await getPipeline(d.name)
       expect(pipeLine.body.nodes[1].nodeName).to.equal(newNodeName)
       await deletePipeline(d)

       const res = await putStorePipelineWithDescriptor(d.pipeline)

        expect(res.text).to.contain("pipeline addmult Not Found")

    }).timeout(1000 * 60 * 5);


    it(" TID-330- delete pipeline", async () => {
        
        //set test data to testData1
        const d = deconstructTestData(testData4)
        await deletePipeline(d)

        const t =await storePipeline(d)
        await delay(2000)
        const del = await deletePipeline(d)
        //expect(del.status).to.equal(200)
        const del1 = await deletePipeline(d)
        expect(del1.text).to.contain("pipeline addmult Not Found")
    }).timeout(1000 * 60 * 5);

    it(" TID-340- get all pipeline", async () => {
        
        //set test data to testData1
        const d = deconstructTestData(testData4)
        const del = await deletePipeline(d)
        const allPipeline = await getAllPipeline();
        const a = allPipeline.body.filter(obj => obj.name == d.name)
        await storePipeline(d)
        expect(a.length).to.equal(0)
        const allPipeline1 = await getAllPipeline();
        const b = allPipeline1.body.filter(obj => obj.name == d.name)
        expect(b.length).to.equal(1)
    }).timeout(1000 * 60 * 5);

    it(" TID-350- wait any condition", async () => {
        
        //set test data to testData1
        const d = deconstructTestData(testData2)
        await deletePipeline(d)
        await storePipeline(d)
        
        const res = await runStoredAndWaitForResults(d)
        const result = await  getResult(res,200)
        const expected = [8,90,15,128]
        const a = result.data.filter(obj => !expected.includes(obj.result) )
        expect(a.length).to.be.equal(0)
    }).timeout(1000 * 60 * 5);

   
    it(" TID-360- indexed condition", async () => {
        
        //set test data to testData1
        const d = deconstructTestData(testData3)
        await deletePipeline(d)
        await storePipeline(d)
        
        const res = await runStoredAndWaitForResults(d)
        const result = await  getResult(res,200)
        const expected = [27,-3,7,55]
        const a = result.data.filter(obj => !expected.includes(obj.result) )
        expect(a.length).to.be.equal(0)
    }).timeout(1000 * 60 * 5);

    it(" mix condition", async () => {
        
        //set test data to testData1
        const d = deconstructTestData(testData5)
        await deletePipeline(d)
        await storePipeline(d)
        
        const res = await runStoredAndWaitForResults(d)
        const result = await  getResult(res,200)
       
    }).timeout(1000 * 60 * 5);


});

});