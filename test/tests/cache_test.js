const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')

const { storeAlgorithm } = require('../../utils/algorithmUtils')
const {
    getSpansByJodid
} = require('../../utils/jaeger')

const {
    testData1
} = require('../../config/index').cacheTest

const {
    getDriverIdByJobId
} = require('../../utils/socketGet')

const {
    body,
    deletePod,
    filterPodsByName,
    getPodNode
} = require('../../utils/kubeCtl')

const {
    getResult
} = require('../../utils/results')

// const KubernetesClient = require('@hkube/kubernetes-client').Client;
const {
    deletePipeline,
    storePipeline,
    runStored,
    deconstructTestData,
    runStoredAndWaitForResults
} = require('../../utils/pipelineUtils')
const {
    write_log
} = require('../../utils/misc_utils')
chai.use(chaiHttp);

describe('Test worker cache 576', () => {

    //https://app.zenhub.com/workspaces/hkube-5a1550823895aa68ea903c98/issues/kube-hpc/hkube/576
    it.skip('storage get amount old do not run ', async () => {


        const alg = await storeAlgorithm("lonstringv1");
        //set test data to testData1
        const d = deconstructTestData(testData1)
        await deletePipeline(d)
        //store pipeline evalwait
        await storePipeline(d)

        //run the pipeline 

        const jobId = await runStoredAndWaitForResults(d)

        const pods = await filterPodsByName("eval-alg")

        const data = await getSpansByJodid(jobId)
        let setJobResult = data.filter(obj => obj.operationName.includes("set job result"))
        let storageGet = data.filter(obj => obj.operationName == "storage-get").filter(obj => obj.references.length > 0)

        let wz = storageGet.filter(obj => obj.references[0].spanID != setJobResult[0].spanID)

        const a = Math.abs(pods.length - wz.length / 2)
        expect(a).to.be.lessThan(30)
    }).timeout(1000 * 60 * 5);




});