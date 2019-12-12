const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')

const {
    getPodsRunning
} = require(path.join(process.cwd(), 'utils/results'))
const {
    testData1
} = require(path.join(process.cwd(), 'config/index')).tid_160
const logger = require(path.join(process.cwd(), 'utils/logger'))
const {
    getDriverIdByJobId
} = require(path.join(process.cwd(), 'utils/socketGet'))

const {
    client
} = require(path.join(process.cwd(), 'utils/kubtry'))

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

const {
    getLogByJobId,
    waitForLog
} = require(path.join(process.cwd(), 'utils/elasticsearch'))

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const deletePod = async (podName, namespace) => {
    let deletedPod = ''
    if (typeof podName !== "undefined") {
        write_log("start delete")
        deletedPod = await client.api.v1.namespaces(namespace).pods(podName).delete()
    } else {
        write_log("Not delete")
    }
    return deletedPod
}

const filterPodsByName = async (name) => {
    const pod = await client.api.v1.namespaces('default').pods().get()

    const pods = pod.body.items.filter(obj => obj.metadata.name.includes(name))

    return pods
}

const getPodNode = async (podName) => {
    const pod = await client.api.v1.namespaces('default').pods(podName).get()
    const node = pod.body.spec.nodeName
    return node
}

const FailSingelPod = async (podName, namespace = 'default') => {
    //set test data to testData1
    const d = deconstructTestData(testData1)

    //store pipeline evalwait
    const a = await storePipeline(d)

    //run the pipeline evalwait
    const res = await runStored(d)
    const jobId = res.body.jobId

    const ServewrPod = await filterPodsByName(podName)
    write_log(ServewrPod[0].metadata.name)
    const deleted = await deletePod(ServewrPod[0].metadata.name, namespace)
    await delay(60000)

    const result = await getResult(jobId, 200)

    expect(result.status).to.be.equal('completed');

    const newServer = await filterPodsByName(podName)
    write_log(newApiServer[0].metadata.name)
    expect(ServewrPod[0].metadata.name).to.be.not.equal(newServer[0].metadata.name)


}
describe('TID-161- High Availability for HKube infrastructure services', () => {
    it('Fail pipeline driver  ', async () => {
        // const pod = await client.api.v1.namespaces('default').pods(podName).delete();

        //set test data to testData1
        const d = deconstructTestData(testData1)

        //store pipeline evalwait
        await storePipeline(d)

        //run the pipeline evalwait
        const res = await runStored(d)
        const jobId = res.body.jobId
        const driver = await getDriverIdByJobId(jobId)

        const podName = driver[0].podName
        write_log('podName-' + podName)
        await delay(2000)

        const pod = await deletePod(podName)
        await delay(2000)
        //get result
        const result = await getResult(jobId, 200)
        write_log(result.status)
        write_log(result.error, 'error')
        expect(result.status).to.be.equal('completed');
    }).timeout(1000 * 60 * 5);


    it('Fail algorithm driver  ', async () => {
        //TODO : add the ability to remove more then one algorithm
        // const pod = await client.api.v1.namespaces('default').pods(podName).delete();

        //set test data to testData1
        const d = deconstructTestData(testData1)

        //store pipeline evalwait
        await storePipeline(d)

        //run the pipeline evalwait
        const res = await runStored(d)
        const jobId = res.body.jobId
        await delay(5000)
        const nodes = await getPiplineNodes(jobId)
        const podName = nodes.body[0]
        write_log('podName-' + podName)
        await delay(2000)

        const pod = await deletePod(podName)
        await delay(2000)
        //get result
        const result = await getResult(jobId, 200)
        write_log(result.status)
        write_log(result.error, 'error')
        expect(result.status).to.be.equal('completed');
    }).timeout(1000 * 60 * 5);

    it('Fail jaeger   ', async () => {
        const d = deconstructTestData(testData1)

        //store pipeline evalwait
        await storePipeline(d)

        //run the pipeline evalwait
        const res = await runStored(d)
        const jobId = res.body.jobId
        const driver = await getDriverIdByJobId(jobId)

        const pilelineDriverPod = driver[0].podName

        const currentNode = getPodNode(pilelineDriverPod)

        const jaegerPods = await filterPodsByName("jaeger") //[0].metadata.name

        // find the jaeger that run on the same node as the pipeline driver. 
        const jaegrPod = jaegerPods.filter(obj => obj.spec.nodeName.equal(currentNode))

        const deleted = await deletePod(jaegrPod[0].metadata.name)

        await delay(60000)

        const result = await getResult(jobId, 200)

        expect(result.status).to.be.equal('completed');

    }).timeout(1000 * 60 * 5);

    it('Fail API server  ', async () => {

        await FailSingelPod("api-server")

    }).timeout(1000 * 60 * 5);

    it('Fail monitor-server  ', async () => {

        await FailSingelPod("monitor-server")

    }).timeout(1000 * 60 * 5);

    it('Fail simulator  ', async () => {

        await FailSingelPod("simulator")

    }).timeout(1000 * 60 * 5);

    it('Fail task-executor  ', async () => {

        await FailSingelPod("task-executor")

    }).timeout(1000 * 60 * 5);

    it('Fail resource-manager  ', async () => {

        await FailSingelPod("resource-manager")

    }).timeout(1000 * 60 * 5);

    it('Fail algorithm-operator  ', async () => {

        await FailSingelPod("algorithm-operator")

    }).timeout(1000 * 60 * 5);

    it('Fail trigger-service  ', async () => {

        await FailSingelPod("trigger-service")

    }).timeout(1000 * 60 * 5);

    it('Fail prometheus  ', async () => {

        await FailSingelPod("prometheus", "monitoring")

    }).timeout(1000 * 60 * 5);



});