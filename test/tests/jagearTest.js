const chai = require('chai');
const path = require('path');
const chaiHttp = require('chai-http');

const expect = chai.expect;
const assertArrays = require('chai-arrays');
const {
    deletePipeline,
    getPiplineNodes,
    storePipeline,
    runStored,
    deconstructTestData,
    runStoredAndWaitForResults
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))



const {getWebSocketData} = require(path.join(process.cwd(), 'utils/socketGet'))
const {storeAlgorithm } = require(path.join(process.cwd(), 'utils/algorithmUtils'))

const {
    getSpansByJodid
} = require(path.join(process.cwd(), 'utils/jaeger'))
chai.use(chaiHttp);
chai.use(assertArrays);
const { deleteAlgorithm,   
    buildAlgoFromImage} = require(path.join(process.cwd(), 'utils/algorithmUtils'))
const {
        testData1,
        testData2
    } = require(path.join(process.cwd(), 'config/index')).jagearTest

describe('jagear', () => {

        let alg = {
            name: "versatile",
            cpu: 1,
            gpu: 0,
            mem: "256Mi",
            minHotWorkers: 0,
            algorithmImage: "tamir321/versatile:04",
            type: "Image",
            options: {
                debug: false,
                pending: false
                }       
            }
            
    it('test', async () => {
        const aa = await  deleteAlgorithm("versatile",true)
        const bb = await buildAlgoFromImage(alg);
//need to add alg versatile-pipe
        const algName = "black-alg"
        const pipe = {
            "name": "versatile-pipe",
            "flowInput": {
                "inp": [{
                    "type": "algorithm",
                    "name": `${algName}`,
                    "input":["a"]
                }]
            }
        }
        const d = deconstructTestData(testData1)

        //store pipeline evalwait
        const a = await storePipeline(d)
    
        //run the pipeline evalwait
       

        const jobId = await runStoredAndWaitForResults(pipe)
        const data = await getSpansByJodid(jobId)
        let found = false
        data.forEach(element => {
            // console.log(element.operationName)
            if (element.operationName.startsWith(algName)) {
                found = true
            }

        });

        expect(found).to.be.true
        
    }).timeout(1000 * 5*60)

})


describe('Test worker cache 576', () => {

    //https://app.zenhub.com/workspaces/hkube-5a1550823895aa68ea903c98/issues/kube-hpc/hkube/576
    it('storage get amount  ', async () => {
       

        const alg =  await storeAlgorithm("lonstringv1");
        //set test data to testData1
        const d = deconstructTestData(testData2)
        await deletePipeline(d)
        //store pipeline evalwait
        await storePipeline(d)

        //run the pipeline 

       const jobId = await runStoredAndWaitForResults(d)

       const WSdata = await getWebSocketData()
        const pods = WSdata.discovery.worker.filter(worker => worker.algorithmName == "eval-alg")


        const data = await getSpansByJodid(jobId)
        let setJobResult = data.filter(obj => obj.operationName.includes("set job result"))
        let storageGet = data.filter(obj => obj.operationName == "storage-get").filter(obj => obj.references.length>0)

        let wz = storageGet.filter(obj => obj.references[0].spanID != setJobResult[0].spanID)
        
        const a = Math.abs(pods.length-wz.length/2)
        expect(a).to.be.lessThan(30)
    }).timeout(1000 * 60 * 5);


   

});