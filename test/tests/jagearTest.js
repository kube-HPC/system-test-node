const chai = require('chai');
const path = require('path');
const chaiHttp = require('chai-http');

const expect = chai.expect;
const assertArrays = require('chai-arrays');
const {
    getPiplineNodes,
    storePipeline,
    runStored,
    deconstructTestData,
    runStoredAndWaitForResults
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))
const {
    getSpansByJodid
} = require(path.join(process.cwd(), 'utils/jaeger'))
chai.use(chaiHttp);
chai.use(assertArrays);
const { deleteAlgorithm,   
    buildAlgoFromImage} = require(path.join(process.cwd(), 'utils/algorithmUtils'))
const {
        testData1
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
        
    }).timeout(1000 * 60)

})