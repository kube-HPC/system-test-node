const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path');
const delay = require('delay');

const {
    testData1,
    testData2,
    testData3,
    testData4
} = require(path.join(process.cwd(), 'config/index')).tid_161;

const {
    getDriverIdByJobId
} = require('../utils/socketGet');

const {
    FailSinglePod,
    deletePod,
    filterPodsByName,
    getPodNode
} = require('../utils/kubeCtl');

const {
    getResult
} = require('../utils/results');

// const KubernetesClient = require('@hkube/kubernetes-client').Client;
const {
    deletePipeline,
    getPiplineNodes,
    storePipeline,
    runStored,
    deconstructTestData
} = require('../utils/pipelineUtils');

const {
    write_log
} = require('../utils/misc_utils');

chai.use(chaiHttp);

const {
    getLogByPodName
} = require('../utils/elasticsearch');

describe('TID-161- High Availability for HKube infrastructure services', () => {

    beforeEach(function () {
        console.log('\n-----------------------------------------------\n');
    });
    
    describe('pipeline driver fail over', () => {
        it('Fail pipeline driver  ', async () => {
            //set test data to testData1
            const d = deconstructTestData(testData1);
            await deletePipeline(d);
            //store pipeline evalwait
            await storePipeline(d);
            //run the pipeline evalwait
            const res = await runStored(d);
            const jobId = res.body.jobId;
            console.log("jobId = " + jobId);
            let drivers = [];
            let times = 0;
            while (drivers.length == 0 && times < 10) {
                await delay(1000);
                drivers = await getDriverIdByJobId(jobId);
                times++;
            }
            console.log("driver = " + drivers);
            const podName = drivers[0].podName;
            write_log('podName-' + podName);
            await deletePod(podName);
            //get result
            const result = await getResult(jobId, 200);
            write_log(result.status);
            write_log(result.error, 'error');
            expect(result.status).to.be.equal('completed');
        }).timeout(1000 * 60 * 60);

        it('kill pipeline driver  singe batch', async () => {
            const d = deconstructTestData(testData3);
            const pipe = {
                name: d.name,
                flowInput: {
                    inp: 25000
                }
            }
            await delay(2000);
            await deletePipeline(d.name);
            await storePipeline(d);
            const res = await runStored(pipe);
            const jobId = res.body.jobId;
            await delay(15000);
            const driver = await getDriverIdByJobId(jobId);

            const podName = driver[0].podName;
            write_log('podName-' + podName);

            const pod = await deletePod(podName);
            write_log('podName-' + podName);
            await delay(25000);

            const newdriver = await getDriverIdByJobId(jobId);
            console.log("new driver =" + newdriver);

            await delay(3000);

            await getResult(jobId, 200);
        }).timeout(1000 * 60 * 5);

        it('kill pipeline driver  multiple batch', async () => {
            const e = deconstructTestData(testData2);

            await storePipeline(e);

            const res = await runStored(e);
            const jobId = res.body.jobId;
            await delay(3000);

            const driver = await getDriverIdByJobId(jobId);

            const podName = driver[0].podName;
            write_log('podName-' + podName);
            await delay(2000);

            await deletePod(podName);
            write_log('podName-' + podName);
            await delay(10000);
            const newdriver = await getDriverIdByJobId(jobId);
            console.log("new driver =" + newdriver);
            await getResult(jobId, 200);
        }).timeout(1000 * 60 * 10);

        it('kill pipeline driver   batch on batch', async () => {
            const e = deconstructTestData(testData4);
            await storePipeline(e);

            const res = await runStored(e);
            const jobId = res.body.jobId;
            await delay(7000);

            const driver = await getDriverIdByJobId(jobId);

            const podName = driver[0].podName;
            write_log('podName-' + podName);
            await delay(2000);

            await deletePod(podName);
            write_log('podName-' + podName);
            await delay(15000);
            const newdriver = await getDriverIdByJobId(jobId);
            console.log("new driver =" + newdriver);
            await getResult(jobId, 200);
        }).timeout(1000 * 60 * 10);
    });

    it.skip('Fail algorithm pod  ', async () => {
        const numberToDelete = 50;
        const pipe = {
            name: "eval-dynamic-160",
            flowInput: {
                range: 30,
                inputs: 50000
            }
        }
        //set test data to testData1
        const d = deconstructTestData(testData1);
        await deletePipeline(d);
        //store pipeline evalwait
        await storePipeline(d);

        //run the pipeline evalwait
        const res = await runStored(pipe);

        const jobId = res.body.jobId;

        await delay(20000);
        const nodes = await getPiplineNodes(jobId);
        const partNodes = nodes.slice(0, numberToDelete);

        const allAlg = partNodes.map(async (element) => { deletePod(element, 'default') });
        await Promise.all(allAlg);

        await delay(15000);
        const log = await getLogByPodName(partNodes[0]);
        let a = log.hits.hits.filter(obj => obj._source.message.includes("exit code 1")); //or find "SIGTERM"
        expect(a).to.have.lengthOf.greaterThan(0);
        write_log(result.status);
        write_log(result.error, 'error');
        expect(result.status).to.be.equal('completed');
    }).timeout(1000 * 60 * 10);

    it('Fail jaeger', async () => {
        const d = deconstructTestData(testData1);
        //store pipeline evalwait
        await deletePipeline(d);
        await storePipeline(d);
        //run the pipeline evalwait
        const res = await runStored(d);
        const jobId = res.body.jobId;
        let driver = undefined;
        while (!driver) {
            const drivers = await getDriverIdByJobId(jobId);
            driver = drivers[0];
            if (driver) {
                const pilelineDriverPod = driver.podName;
                const currentNode = await getPodNode(pilelineDriverPod);
                const jaegerPods = await filterPodsByName("jaeger"); //[0].metadata.name
                // find the jaeger that run on the same node as the pipeline driver. 
                const jaegrPod = jaegerPods.filter(obj => obj.spec.nodeName == currentNode);
                await deletePod(jaegrPod[0].metadata.name);
            }
            else {
                await delay(1000);
            }
        }
        await delay(20000);
        const result = await getResult(jobId, 200);
        expect(result.status).to.be.equal('completed');
    }).timeout(1000 * 60 * 60);

    it('Fail API server  ', async () => {
        await FailSinglePod("api-server");
    }).timeout(1000 * 60 * 60);

    it('Fail simulator  ', async () => {
        await FailSinglePod("simulator");
    }).timeout(1000 * 60 * 60);

    it('Fail task-executor  ', async () => {
        await FailSinglePod("task-executor");
    }).timeout(1000 * 60 * 60);

    it('Fail resource-manager  ', async () => {
        await FailSinglePod("resource-manager");
    }).timeout(1000 * 60 * 60);

    it('Fail algorithm-operator  ', async () => {
        await FailSinglePod("algorithm-operator");
    }).timeout(1000 * 60 * 60);

    it('Fail trigger-service  ', async () => {
        await FailSinglePod("trigger-service");
    }).timeout(1000 * 60 * 60);

    it.skip('Fail prometheus  ', async () => {
        await FailSinglePod("prometheus-node", "monitoring");
    }).timeout(1000 * 60 * 60);

    it.skip('Fail monitoring-grafana  ', async () => {
        await FailSinglePod("monitoring-grafana", "monitoring");
    }).timeout(1000 * 60 * 60);
});