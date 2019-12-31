const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')

const {storeAlgorithm } = require(path.join(process.cwd(), 'utils/algorithmUtils'))
const {
    getSpansByJodid
} = require(path.join(process.cwd(), 'utils/jaeger'))

const {
    testData1
} = require(path.join(process.cwd(), 'config/index')).cacheTest

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

describe('Test worker cache', () => {

    
    it('storage get amount  ', async () => {
       

        const alg =  await storeAlgorithm("lonstringv1");
        //set test data to testData1
        const d = deconstructTestData(testData1)

        //store pipeline evalwait
        await storePipeline(d)

        //run the pipeline 

       const jobId = await runStoredAndWaitForResults(d)

        const pods = await filterPodsByName("eval-alg")

        const data = await getSpansByJodid(jobId)
        let setJobResult = data.filter(obj => obj.operationName.includes("set job result"))
        let storageGet = data.filter(obj => obj.operationName == "storage-get").filter(obj => obj.references.length>0)

        let wz = storageGet.filter(obj => obj.references[0].spanID != setJobResult[0].spanID)
        
        const a = Math.abs(pods.length-wz.length/2)
        expect(a).to.be.lessThan(3)
    }).timeout(1000 * 60 * 5);


   

});