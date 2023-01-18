const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')


const {
    testData2,
    testData3
} = require(path.join(process.cwd(), 'config/index')).tid_70

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
    deletePipeline,
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

const FailSingelPod = async (podName, namespace = 'default') => {
    //set test data to testData1
    const d = deconstructTestData(testData1)

    //store pipeline evalwait
    await deletePipeline(d)
    await storePipeline(d)

    //run the pipeline evalwait
    const res = await runStored(d)
    const jobId = res.body.jobId
    await delay(5000)
    const ServewrPod = await filterPodsByName(podName, namespace)
    write_log(ServewrPod[0].metadata.name)
    const deleted = await deletePod(ServewrPod[0].metadata.name, namespace)
    await delay(15000)

    const result = await getResult(jobId, 200)

    expect(result.status).to.be.equal('completed');

    const newServer = await filterPodsByName(podName, namespace)
    write_log(newServer[0].metadata.name)
    expect(ServewrPod[0].metadata.name).to.be.not.equal(newServer[0].metadata.name)


}
describe('TID-100 371 long running algorithms  and pipline ', () => {


    it('5 minutes algorithm  (git 46)', async () => {
        const timeout = 5 * 60 * 1000
        const pipe = {
            "name": "evalwait",
            "flowInput": {
                "inputs": [[timeout]]
            }
        }

        const d = deconstructTestData(testData2)
        await deletePipeline(d)
        //store pipeline evalwait
        await storePipeline(d)
        //run the pipeline evalwait
        const res = await runStored(pipe)
        const jobId = res.body.jobId
        await delay(timeout)
        //get result
        const result = await getResult(jobId, 200)

        expect(result.status).to.be.equal('completed');
    }).timeout(1000 * 60 * 10);


    it('10 minutes algorithm with batch (git 46)', async () => {

        const timeout = 10 * 60 * 1000
        const pipe = {
            "name": "evalwait",
            "flowInput": {
                "inputs": [[timeout], [timeout], [timeout], [timeout], [timeout], [timeout], [timeout], [timeout], [timeout], [timeout]]
            }
        }

        const d = deconstructTestData(testData2)
        await deletePipeline(d)
        //store pipeline evalwait
        await storePipeline(d)
        //run the pipeline evalwait
        const res = await runStored(pipe)
        const jobId = res.body.jobId
        await delay(timeout)
        //get result
        const result = await getResult(jobId, 200)

        expect(result.status).to.be.equal('completed');
    }).timeout(1000 * 60 * 20);


    it('TID 371 5000 batch (git 82)', async () => {
        const d = deconstructTestData(testData3)
        await deletePipeline(d)
        //store pipeline evalwait
        await storePipeline(d)
        //run the pipeline evalwait
        const res = await runStored(d)
        const jobId = res.body.jobId

        //get result
        const result = await getResult(jobId, 200)

        expect(result.status).to.be.equal('completed');
    }).timeout(1000 * 60 * 20);



});