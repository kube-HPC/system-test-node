const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')
const config = require('../config/config');


const {
    testData1,
    testData2,
    testData3,
    testData4
} = require(path.join(process.cwd(), 'config/index')).tid_161

const {
    getDriverIdByJobId
} = require('../utils/socketGet')

const {
    FailSingelPod,
    deletePod,
    filterPodsByName,
    getPodNode
} = require('../utils/kubeCtl')

const {
    getResult
} = require('../utils/results')

// const KubernetesClient = require('@hkube/kubernetes-client').Client;
const {
    deletePipeline,
    getPiplineNodes,
    storePipeline,
    runStored,
    deconstructTestData,
    runStoredAndWaitForResults
} = require('../utils/pipelineUtils')
const {
    write_log
} = require('../utils/misc_utils')
chai.use(chaiHttp);

const {
    getLogByJobId,
    getLogByPodName
} = require('../utils/elasticsearch')

describe('TID-161- High Availability for HKube infrastructure services', () => {
    before(async function () {
        this.timeout(1000 * 60 * 15);
        let testUserBody ={
            username: "dev-placeholder",
            password: "dev-placeholder"
        }
        const response = await chai.request(config.apiServerUrl)
        .post('/auth/login')
        .send(testUserBody)
        
        if (response.status === 200) {
            console.log('guest login success');
            dev_token = response.body.token;
        }
        else {
            throw new Error("Failed to fetch Keycloak token");
        }
    });
    let dev_token;
    describe('pipeline driver fail over', () => {


        it('Fail pipeline driver  ', async () => {

            //set test data to testData1
            const d = deconstructTestData(testData1)
            await deletePipeline(d, dev_token)
            //store pipeline evalwait
            await storePipeline(d, dev_token)
            //run the pipeline evalwait
            const res = await runStored(d, dev_token)
            const jobId = res.body.jobId
            console.log("jobId = " + jobId);
            let drivers = [];
            let times = 0;
            while (drivers.length == 0 && times < 10) {
                await delay(1000);
                drivers = await getDriverIdByJobId(jobId)
                times++;
            }
            console.log("driver = " + drivers);
            const podName = drivers[0].podName
            write_log('podName-' + podName)
            const pod = await deletePod(podName)
            //get result
            const result = await getResult(jobId, 200, dev_token)
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
            await deletePipeline(d.name, dev_token)
            await storePipeline(d, dev_token)
            const res = await runStored(pipe, dev_token)
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

            const result = await getResult(jobId, 200, dev_token)


        }).timeout(1000 * 60 * 5);

        it('kill pipeline driver  multiple batch', async () => {
            const e = deconstructTestData(testData2)

            await storePipeline(e, dev_token)

            const res = await runStored(e, dev_token)
            const jobId = res.body.jobId
            await delay(3000)


            const driver = await getDriverIdByJobId(jobId)

            const podName = driver[0].podName
            write_log('podName-' + podName)
            await delay(2000)

            const pod = await deletePod(podName)
            write_log('podName-' + podName)
            await delay(10000)
            const newdriver = await getDriverIdByJobId(jobId)
            console.log("new driver =" + newdriver)
            const result = await getResult(jobId, 200, dev_token)
        }).timeout(1000 * 60 * 10);



        it('kill pipeline driver   batch on batch', async () => {
            const e = deconstructTestData(testData4)
            await storePipeline(e, dev_token)

            const res = await runStored(e, dev_token)
            const jobId = res.body.jobId
            await delay(7000)


            const driver = await getDriverIdByJobId(jobId)

            const podName = driver[0].podName
            write_log('podName-' + podName)
            await delay(2000)

            const pod = await deletePod(podName)
            write_log('podName-' + podName)
            await delay(15000)
            const newdriver = await getDriverIdByJobId(jobId)
            console.log("new driver =" + newdriver)
            const result = await getResult(jobId, 200, dev_token)
        }).timeout(1000 * 60 * 10);


    })




    it.skip('Fail algorithm pod  ', async () => {
        const numberToDelete = 50
        const pipe = {
            name: "eval-dynamic-160",
            flowInput: {
                range: 30,
                inputs: 50000
            }
        }
        //set test data to testData1
        const d = deconstructTestData(testData1)
        await deletePipeline(d, dev_token)
        //store pipeline evalwait
        await storePipeline(d, dev_token)

        //run the pipeline evalwait
        const res = await runStored(pipe, dev_token)

        const jobId = res.body.jobId

        await delay(20000)
        const nodes = await getPiplineNodes(jobId)
        const partNodes = nodes.slice(0, numberToDelete)

        const allAlg = partNodes.map(async (element) => { deletePod(element, 'default') })
        await Promise.all(allAlg);


        await delay(15000)
        const log = await getLogByPodName(partNodes[0])
        let a = log.hits.hits.filter(obj => obj._source.message.includes("exit code 1")) //or find "SIGTERM"
        expect(a).to.have.lengthOf.greaterThan(0)
        write_log(result.status)
        write_log(result.error, 'error')
        expect(result.status).to.be.equal('completed');


    }).timeout(1000 * 60 * 10);


    it('Fail jaeger   ', async () => {
        const d = deconstructTestData(testData1)
        //store pipeline evalwait
        await deletePipeline(d, dev_token)
        const a = await storePipeline(d, dev_token)
        //run the pipeline evalwait
        const res = await runStored(d, dev_token)
        const jobId = res.body.jobId
        let driver = undefined
        while (!driver) {
            const drivers = await getDriverIdByJobId(jobId)
            driver = drivers[0];
            if (driver) {
                const pilelineDriverPod = driver.podName
                const currentNode = await getPodNode(pilelineDriverPod)
                const jaegerPods = await filterPodsByName("jaeger") //[0].metadata.name
                // find the jaeger that run on the same node as the pipeline driver. 
                const jaegrPod = jaegerPods.filter(obj => obj.spec.nodeName == currentNode)
                await deletePod(jaegrPod[0].metadata.name)
            }
            else {
                await delay(1000)
            }
        }
        await delay(20000)
        const result = await getResult(jobId, 200, dev_token)
        expect(result.status).to.be.equal('completed');
    }).timeout(1000 * 60 * 60);

    it('Fail API server  ', async () => {

        await FailSingelPod("api-server", dev_token)

    }).timeout(1000 * 60 * 60);


    it('Fail simulator  ', async () => {

        await FailSingelPod("simulator", dev_token)

    }).timeout(1000 * 60 * 60);

    it('Fail task-executor  ', async () => {

        await FailSingelPod("task-executor", dev_token)

    }).timeout(1000 * 60 * 60);

    it('Fail resource-manager  ', async () => {

        await FailSingelPod("resource-manager", dev_token)

    }).timeout(1000 * 60 * 60);

    it('Fail algorithm-operator  ', async () => {

        await FailSingelPod("algorithm-operator", dev_token)

    }).timeout(1000 * 60 * 60);

    it('Fail trigger-service  ', async () => {

        await FailSingelPod("trigger-service", dev_token)

    }).timeout(1000 * 60 * 60);

    it.skip('Fail prometheus  ', async () => {

        await FailSingelPod("prometheus-node", dev_token, "monitoring")

    }).timeout(1000 * 60 * 60);


    it.skip('Fail monitoring-grafana  ', async () => {

        await FailSingelPod("monitoring-grafana", dev_token, "monitoring")

    }).timeout(1000 * 60 * 60);



});