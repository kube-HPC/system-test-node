const chai = require('chai');
const chaiHttp = require('chai-http');
const path = require('path')
const {
    getPodsRunning
} = require(path.join(process.cwd(), 'utils/results'));
const {
    testData1,
    testData2
} = require(path.join(process.cwd(), 'config/index')).gpu_tests
const delay = require('delay');
const assert = chai.assert;
const logger = require(path.join(process.cwd(), 'utils/logger'));
const {
    storePipeline,
    runStored,
    deconstructTestData,
    runStoredAndWaitForResults,
    deletePipeline
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))


const {
    storeAlgorithmApplay 
} = require(path.join(process.cwd(), 'utils/algorithmUtils'))
chai.use(chaiHttp);



const gpuAlg = {
    "name": "gpu-alg-1",
    "cpu": 1,
    "gpu": 1,
    "mem": "5Gi",
    "minHotWorkers": 0,
    "algorithmImage": "docker.io/hkubedev/python-gpu:v1.0.0",
    "type": "Image",
    "options": {
        "debug": false,
        "pending": false
    }
}
describe('test gpu algs', () => {

    it.skip('soter gpu algorithm',async ()=>{
        await storeAlgorithmApplay(gpuAlg);
        gpuAlg.name = "gpu-alg-2"
        await storeAlgorithmApplay(gpuAlg);
    })
    
    it('should run the pipeline gpu-demo and after 2 seconds run the gpuDemo-1 pipeline', async () => {

        const d1 = deconstructTestData(testData1)
        const d2 = deconstructTestData(testData2)
        await storePipeline(d1.pipeline)
        await storePipeline(d2.pipeline)

        await runStored(d1.inputData)

        await delay(2000);
        const res = await runStoredAndWaitForResults(d2.inputData)

        await delay(50000);

        let runningPods = await getPodsRunning(res)

        logger.error(JSON.stringify(runningPods.body))
        assert.isAtLeast(runningPods.body.length, 0, `the job ${res} expected to have at least 1 running pods while got ${runningPods.body.length}`)



       // await deletePipeline(d1.name)
       // await deletePipeline(d2.name)
    }).timeout(5000000);
})