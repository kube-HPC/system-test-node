const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')


const {
    testData1,
    testData2,
    testData3,
    testData4
} = require(path.join(process.cwd(), 'config/index')).tid_161

const {
    getDriverIdByJobId
} = require('../../../utils/socketGet')

const {


    deletePod,

} = require('../../../utils/kubeCtl')

const {
    getResult
} = require('../../../utils/results')

// const KubernetesClient = require('@hkube/kubernetes-client').Client;
const {
    deletePipeline,
    storePipeline,
    runStored,
    deconstructTestData,
    runStoredAndWaitForResults
} = require('../../../utils/pipelineUtils')
const {
    write_log
} = require('../../../utils/misc_utils')
chai.use(chaiHttp);

const {
    getLogByJobId,
    getLogByPodName
} = require('../../../utils/elasticsearch')

describe('pipeline driver fail over', () => {


    it('Fail pipeline driver  ', async () => {


        //set test data to testData1
        const d = deconstructTestData(testData1)
        await deletePipeline(d)
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
    }).timeout(1000 * 60 * 60);

    it('kill pipeline driver  singe batch', async () => {
        const d = deconstructTestData(testData3)
        const pipe = {
            name: d.name,
            flowInput: {
                inp: 25000
            }
        }

        await delay(2000)
        await deletePipeline(d.name)
        await storePipeline(d)
        const res = await runStored(pipe)
        const jobId = res.body.jobId
        await delay(15000)
        const driver = await getDriverIdByJobId(jobId)

        const podName = driver[0].podName
        write_log('podName-' + podName)

        const pod = await deletePod(podName)
        write_log('podName-' + podName)
        await delay(25000)

        const newdriver = await getDriverIdByJobId(jobId)
        console.log("new driver =" + newdriver)

        await delay(3000)

        const result = await getResult(jobId, 200)


    }).timeout(1000 * 60 * 5);

    it('kill pipeline driver  multiple batch', async () => {
        const e = deconstructTestData(testData2)

        await storePipeline(e)

        const res = await runStored(e)
        const jobId = res.body.jobId
        await delay(5000)


        const driver = await getDriverIdByJobId(jobId)

        const podName = driver[0].podName
        write_log('podName-' + podName)
        await delay(2000)

        const pod = await deletePod(podName)
        write_log('podName-' + podName)
        await delay(10000)
        const newdriver = await getDriverIdByJobId(jobId)
        console.log("new driver =" + newdriver)
        const result = await getResult(jobId, 200)
    }).timeout(1000 * 60 * 10);



    it('kill pipeline driver   batch on batch', async () => {
        const e = deconstructTestData(testData4)
        await storePipeline(e)

        const res = await runStored(e)
        const jobId = res.body.jobId
        await delay(70000)


        const driver = await getDriverIdByJobId(jobId)

        const podName = driver[0].podName
        write_log('podName-' + podName)
        await delay(2000)

        const pod = await deletePod(podName)
        write_log('podName-' + podName)
        await delay(10000)
        const newdriver = await getDriverIdByJobId(jobId)
        console.log("new driver =" + newdriver)
        const result = await getResult(jobId, 200)
    }).timeout(1000 * 60 * 10);


});