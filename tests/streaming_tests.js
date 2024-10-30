const chai = require('chai');
const expect = chai.expect;
const delay = require('delay');

// const axios = require('axios')
const {
    deleteAlgorithm,
    storeAlgorithms
} = require('../utils/algorithmUtils')

// const KubernetesClient = require('@hkube/kubernetes-client').Client;
const {
    runRaw,
    stopPipeline
} = require('../utils/pipelineUtils');

const {
    getCurrentPods,
    getRequiredPods,
    getThroughput,
    waitForStatus,
    createFlowInput
} = require('../utils/streamingUtils');

const { intervalDelay } = require('../utils/misc_utils');

const { alg: statefull } = require("../additionalFiles/defaults/algorithms/timeStartstream");

const { pipe: streamSimple } = require("../additionalFiles/defaults/pipelines/stream-simple");

const { pipe: streamMultiple } = require("../additionalFiles/defaults/pipelines/stream-TwoStreamingNodes");

const { alg: stateless } = require("../additionalFiles/defaults/algorithms/timeStateless");

const simple_statefulNodeName = streamSimple.nodes.filter(node => node.stateType === 'stateful')[0].nodeName;
const simple_statelessNodeName = streamSimple.nodes.filter(node => node.stateType === 'stateless')[0].nodeName;

const multiple_statefulNodeName1 = streamMultiple.nodes.filter(node => node.stateType === 'stateful')[0].nodeName;
const multiple_statefulNodeName2 = streamMultiple.nodes.filter(node => node.stateType === 'stateful')[1].nodeName;
const multiple_statelessNodeName = streamMultiple.nodes.filter(node => node.stateType === 'stateless')[0].nodeName;

describe('streaming pipeline test', () => {
    const createAlg = async (alg, cpu) => {
        await deleteAlgorithm(alg.name, true, true)
        if (cpu) {
            alg.cpu = cpu;
        }
        await storeAlgorithms(alg);
    }
    let algList = [];
    after(async function () {
        this.timeout(2 * 60 * 1000);
        console.log("algList = " + algList)
        j = 0
        z = 3

        while (j < algList.length) {
            delAlg = algList.slice(j, z)
            const del = delAlg.map((e) => {
                return deleteAlgorithm(e)
            })
            console.log("delAlg-" + delAlg)
            const delResult = await Promise.all(del)
            console.log("delResult-" + delResult)
            await delay(2000)
            j += 3
            z += 3
            console.log("j=" + j + ",z=" + z)
        }
        console.log("end -----")
    });

    describe("simple pipeline tests", () => {
        it("should satisfy the request rate with the given rate, with enough nodes.", async () => {
            await createAlg(statefull);
            algList.push(statefull.name);
            await createAlg(stateless);
            algList.push(stateless.name);

            streamSimple.flowInput = createFlowInput({
                programs: [
                    { rate: 120, time: 50 }
                ]
            });

            const res = await runRaw(streamSimple);
            const { jobId } = res.body;
            await waitForStatus(jobId, simple_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(jobId, simple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);
            await intervalDelay('Waiting phase 1', 60 * 1000);
            const required = await getRequiredPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            let ratio = await getThroughput(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(ratio).to.be.gt(100); // suppose to be emptying the queue
            expect(required).to.be.gt(3);
            await intervalDelay('Waiting phase 2', 60 * 1000)
            const current = await getCurrentPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(current).to.be.equal(3);
            ratio = await getThroughput(jobId, simple_statefulNodeName, simple_statelessNodeName);
            // ratio suppose to be around 100%
            expect(ratio).to.be.gt(98);
            expect(ratio).to.be.lt(102);
            expect(current).to.be.lt(4);
            await stopPipeline(jobId)
        }).timeout(300 * 1000);

        it("Should scale up at first, then scale down to second rate.", async () => {
            await createAlg(statefull);
            algList.push(statefull.name);
            await createAlg(stateless);
            algList.push(stateless.name);

            streamSimple.flowInput = createFlowInput({
                programs: [
                    { rate: 150, time: 140 },
                    { rate: 50, time: 240 }
                ]
            });

            const res = await runRaw(streamSimple);
            const { jobId } = res.body;
            await waitForStatus(jobId, simple_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            const statelessWaitingTime = await waitForStatus(jobId, simple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);
            await intervalDelay('Waiting phase 1', 145 * 1000 - statelessWaitingTime);
            let required = await getRequiredPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(required).to.be.gt(3);
            await intervalDelay('Waiting phase 2', 70 * 1000);
            required = await getRequiredPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(required).to.be.lt(3);
            await stopPipeline(jobId)
        }).timeout(400 * 1000);

        it("should scale up at first, then scale down to 0 and then back up.", async () => {
            await createAlg(statefull);
            algList.push(statefull.name);
            await createAlg(stateless);
            algList.push(stateless.name);

            streamSimple.flowInput = createFlowInput({
                programs: [
                    { rate: 150, time: 140 },
                    { rate: 0, time: 70 }
                ]
            });

            const res = await runRaw(streamSimple);
            const { jobId } = res.body;
            await waitForStatus(jobId, simple_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            const statelessWaitingTime = await waitForStatus(jobId, simple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);
            await intervalDelay('Waiting phase 1', 140 * 1000 - statelessWaitingTime);
            let required = await getRequiredPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(required).to.be.gte(3);
            await intervalDelay('Waiting phase 2', 50 * 1000);
            required = await getRequiredPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(required).to.be.equal(0);
            await intervalDelay('Waiting phase 3', 75 * 1000);
            required = await getRequiredPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(required).to.be.gt(0);
            await stopPipeline(jobId)
        }).timeout(450 * 1000);

        it("should satisfy the high request rate with high rate, with enough nodes.", async () => {
            await createAlg(statefull, 0.3);
            algList.push(statefull.name);
            await createAlg(stateless);
            algList.push(stateless.name);

            streamSimple.flowInput = createFlowInput({
                programs: [
                    { rate: 1200, time: 50 }
                ]
            });

            const res = await runRaw(streamSimple);
            const { jobId } = res.body;
            await waitForStatus(jobId, simple_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(jobId, simple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);
            await intervalDelay('Waiting phase 1', 120 * 1000);
            const required = await getRequiredPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(required).to.be.gt(26); // ideal amount, but queue is filled
            await intervalDelay('Waiting phase 2', 90 * 1000);
            let current = await getCurrentPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(current).to.be.gt(30); // emptying queue
            let ratio = await getThroughput(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(ratio).to.be.gt(90);
            await intervalDelay('Waiting phase 3', 240 * 1000);
            // Suppose to have 26 pods (not 24 since traffic), but might go to 24~28
            current = await getCurrentPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(current).to.be.lt(29);
            expect(current).to.be.gt(23);
            ratio = await getThroughput(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(ratio).to.be.gt(96);
            await stopPipeline(jobId)
        }).timeout(650 * 1000);

        it("should stabilize on 1 pod.", async () => {
            await createAlg(statefull);
            algList.push(statefull.name);
            await createAlg(stateless);
            algList.push(stateless.name);

            streamSimple.flowInput = createFlowInput({
                processTime: 0.95,
                programs: [
                    { rate: 1, time: 50 }
                ]
            });

            const res = await runRaw(streamSimple);
            const { jobId } = res.body;
            await waitForStatus(jobId, simple_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(jobId, simple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);
            await intervalDelay('Waiting phase 1', 40 * 1000);
            let ratio = await getThroughput(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(ratio).to.be.gt(100); // suppose to be emptying the queue
            await intervalDelay('Waiting phase 2', 50 * 1000);
            current = await getCurrentPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(current).to.be.equal(1);
            ratio = await getThroughput(jobId, simple_statefulNodeName, simple_statelessNodeName);
            // ratio suppose to be around 100%
            expect(ratio).to.be.gt(98);
            expect(ratio).to.be.lt(102);
            await stopPipeline(jobId)
        }).timeout(300 * 1000);

        it("should stabilize on 2 pods.", async () => {
            await createAlg(statefull);
            algList.push(statefull.name);
            await createAlg(stateless);
            algList.push(stateless.name);

            streamSimple.flowInput = createFlowInput({
                processTime: 1,
                programs: [
                    { rate: 1, time: 1 }
                ]
            });

            const res = await runRaw(streamSimple);
            const { jobId } = res.body;
            await waitForStatus(jobId, simple_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(jobId, simple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);
            await intervalDelay('Waiting phase 1', 40 * 1000);
            let ratio = await getThroughput(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(ratio).to.be.gt(100); // suppose to be emptying the queue
            await intervalDelay('Waiting phase 2', 50 * 1000);
            current = await getCurrentPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(current).to.be.equal(2);
            ratio = await getThroughput(jobId, simple_statefulNodeName, simple_statelessNodeName);
            // ratio suppose to be around 100%
            expect(ratio).to.be.gt(98);
            expect(ratio).to.be.lt(102);
            await stopPipeline(jobId)
        }).timeout(300 * 1000);

        it("should stabilize on 21 pods.", async () => {
            await createAlg(statefull, 0.3);
            algList.push(statefull.name);
            await createAlg(stateless);
            algList.push(stateless.name);

            streamSimple.flowInput = createFlowInput({
                processTime: 1,
                programs: [
                    { rate: 20, time: 1 }
                ]
            });

            const res = await runRaw(streamSimple);
            const { jobId } = res.body;
            await waitForStatus(jobId, simple_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(jobId, simple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);
            await intervalDelay('Waiting phase 1', 120 * 1000);
            const required =  await getRequiredPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(required).to.be.gt(21); // ideal amount, but queue is filled
            let current = await getCurrentPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            let ratio = await getThroughput(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(ratio).to.be.gt(100); // suppose to be emptying the queue
            await intervalDelay('Waiting phase 2', 120 * 1000);
            current = await getCurrentPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(current).to.be.equal(21); // should stabalize
            ratio = await getThroughput(jobId, simple_statefulNodeName, simple_statelessNodeName);
            // ratio suppose to be around 100%
            expect(ratio).to.be.gt(98);
            expect(ratio).to.be.lt(102);
            await stopPipeline(jobId)
        }).timeout(450 * 1000);
    });

    describe("multiple streaming nodes pipeline tests", () => {
        it.only("should satisfy the request rate of 2 statefuls", async () => {
            await createAlg(statefull, 0.3);
            algList.push(statefull.name);
            await createAlg(stateless);
            algList.push(stateless.name);

            streamMultiple.flowInput = createFlowInput({
                programs: [
                    { rate: 120, time: 50 }
                ]
            });

            const res = await runRaw(streamMultiple);
            const { jobId } = res.body;
            await waitForStatus(jobId, multiple_statefulNodeName1, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(jobId, multiple_statefulNodeName2, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(jobId, multiple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);
            await intervalDelay('Waiting phase 1', 50 * 1000);
            const required = await getRequiredPods(jobId, multiple_statefulNodeName1, multiple_statelessNodeName);
            let ratio1 = await getThroughput(jobId, multiple_statefulNodeName1, multiple_statelessNodeName);
            let ratio2 = await getThroughput(jobId, multiple_statefulNodeName2, multiple_statelessNodeName);
            expect(ratio1).to.be.gte(100); // suppose to be emptying the queue
            expect(ratio2).to.be.gte(100);
            expect(required).to.be.gte(5);
            await intervalDelay('Waiting phase 2', 60 * 1000)
            const current = await getCurrentPods(jobId, multiple_statefulNodeName1, multiple_statelessNodeName);
            expect(current).to.be.equal(5);
            ratio1 = await getThroughput(jobId, multiple_statefulNodeName1, multiple_statelessNodeName);
            ratio2 = await getThroughput(jobId, multiple_statefulNodeName2, multiple_statelessNodeName);
            // ratio suppose to be around 100% for both
            expect(ratio1).to.be.gt(98);
            expect(ratio1).to.be.lt(102);
            expect(ratio2).to.be.gt(98);
            expect(ratio2).to.be.lt(102);
            await stopPipeline(jobId)
        }).timeout(300 * 1000);
    });

});
