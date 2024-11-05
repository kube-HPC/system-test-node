const chai = require('chai');
const expect = chai.expect;
const delay = require('delay');

const {
    deleteAlgorithm,
    storeAlgorithms
} = require('../utils/algorithmUtils')

const {
    runRaw,
    stopPipeline
} = require('../utils/pipelineUtils');

const {
    getCurrentPods,
    getRequiredPods,
    getThroughput,
    waitForStatus,
    createFlowInput_Simple,
    createFlowInput_ByInterval
} = require('../utils/streamingUtils');

const { 
    intervalDelay,
    checkEqualWithRetries,
    checkInRangeWithRetries
 } = require('../utils/misc_utils');

const { alg: statefull } = require("../additionalFiles/defaults/algorithms/timeStartstream");

const { pipe: streamSimple } = require("../additionalFiles/defaults/pipelines/stream-simple");

const { pipe: streamInterval } = require("../additionalFiles/defaults/pipelines/stream-byInterval");

const { pipe: streamMultiple } = require("../additionalFiles/defaults/pipelines/stream-TwoStreamingNodes");

const { alg: stateless } = require("../additionalFiles/defaults/algorithms/timeStateless");

const { alg: statelessByInterval } = require("../additionalFiles/defaults/algorithms/timeStatelessByInterval.js");

const simple_statefulNodeName = streamSimple.nodes.filter(node => node.stateType === 'stateful')[0].nodeName;
const simple_statelessNodeName = streamSimple.nodes.filter(node => node.stateType === 'stateless')[0].nodeName;

const interval_statefulNodeName = streamInterval.nodes.filter(node => node.stateType === 'stateful')[0].nodeName;
const interval_statelessNodeName = streamInterval.nodes.filter(node => node.stateType === 'stateless')[0].nodeName;

const multiple_statefulNodeName1 = streamMultiple.nodes.filter(node => node.stateType === 'stateful')[0].nodeName;
const multiple_statefulNodeName2 = streamMultiple.nodes.filter(node => node.stateType === 'stateful')[1].nodeName;
const multiple_statelessNodeName = streamMultiple.nodes.filter(node => node.stateType === 'stateless')[0].nodeName;

describe("streaming pipeline test", () => {
    const createAlg = async (alg, cpu) => {
        await deleteAlgorithm(alg.name, true, true)
        if (cpu) {
            alg.cpu = cpu;
        }
        await storeAlgorithms(alg);
    }
    let algList = [];
    beforeEach(function () {
        console.log('\n-----------------------------------------------\n');
    });
    after(async function () {
        this.timeout(2 * 60 * 1000);
        console.log("algList = " + algList);
        j = 0;
        z = 3;

        while (j < algList.length) {
            delAlg = algList.slice(j, z)
            const del = delAlg.map((e) => {
                return deleteAlgorithm(e);
            })
            console.log("delAlg-", JSON.stringify(delAlg, null, 2));
            const delResult = await Promise.all(del);
            delResult.forEach(result => {
                if (result && result.text) {
                    console.log("Delete Result Message:", result.text);
                }
            });
            await delay(2000);
            j += 3;
            z += 3;
            console.log("j=" + j + ",z=" + z);
        }
        console.log("----------------------- end -----------------------");
    });

    describe("simple pipeline tests with constant ratios", () => {
        it("should satisfy the request rate with the given rate, with enough nodes.", async () => {
            await createAlg(statefull);
            algList.push(statefull.name);
            await createAlg(stateless);
            algList.push(stateless.name);

            streamSimple.flowInput = createFlowInput_Simple({
                programs: [
                    { rate: 120, time: 50 }
                ]
            });

            const res = await runRaw(streamSimple);
            const { jobId } = res.body;

            // Wait all nodes to be active
            await waitForStatus(jobId, simple_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(jobId, simple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);

            await intervalDelay('Waiting phase 1', 30 * 1000);
            const required = await getRequiredPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(required).to.be.gt(3);

            await intervalDelay('Waiting phase 2', 50 * 1000);
            const current = await getCurrentPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            const ratio = await getThroughput(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(ratio).to.be.gt(100); // suppose to be emptying the queue
            expect(current).to.be.gt(3);

            await intervalDelay('Waiting phase 3', 90 * 1000)
            await checkEqualWithRetries(getCurrentPods, [jobId, simple_statefulNodeName, simple_statelessNodeName], 3);
            await checkInRangeWithRetries(getThroughput, [jobId, simple_statefulNodeName, simple_statelessNodeName], 99, 101);
            await stopPipeline(jobId)
        }).timeout(350 * 1000);

        it("should satisfy the high request rate with high rate, with enough nodes.", async () => {
            await createAlg(statefull, 0.5);
            algList.push(statefull.name);
            await createAlg(stateless);
            algList.push(stateless.name);

            streamSimple.flowInput = createFlowInput_Simple({
                programs: [
                    { rate: 1200, time: 50 }
                ]
            });

            const res = await runRaw(streamSimple);
            const { jobId } = res.body;

            // Wait all nodes to be active
            await waitForStatus(jobId, simple_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(jobId, simple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);

            await intervalDelay('Waiting phase 1', 30 * 1000);
            const required = await getRequiredPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(required).to.be.gt(26); // ideal amount, but queue is filled

            await intervalDelay('Waiting phase 2', 90 * 1000);
            const current = await getCurrentPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(current).to.be.gt(30); // emptying queue
            const ratio = await getThroughput(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(ratio).to.be.gt(90);

            await intervalDelay('Waiting phase 3', 240 * 1000);
            // Suppose to have 26 pods, but might go to 24~27
            await checkInRangeWithRetries(getCurrentPods, [jobId, simple_statefulNodeName, simple_statelessNodeName], 24, 27);
            await checkInRangeWithRetries(getThroughput, [jobId, simple_statefulNodeName, simple_statelessNodeName], 98, 102);
            await stopPipeline(jobId)
        }).timeout(550 * 1000);

        it("should stabilize on 1 pod.", async () => {
            await createAlg(statefull);
            algList.push(statefull.name);
            await createAlg(stateless);
            algList.push(stateless.name);

            streamSimple.flowInput = createFlowInput_Simple({
                processTime: 0.95,
                programs: [
                    { rate: 1, time: 50 }
                ]
            });

            const res = await runRaw(streamSimple);
            const { jobId } = res.body;

            // Wait all nodes to be active
            await waitForStatus(jobId, simple_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(jobId, simple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);

            await intervalDelay('Waiting phase 1', 40 * 1000);
            const current = await getCurrentPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            const ratio = await getThroughput(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(ratio).to.be.gt(100); // suppose to be emptying the queue
            expect(current).to.be.gt(1);
            
            await intervalDelay('Waiting phase 2', 40 * 1000);
            await checkEqualWithRetries(getCurrentPods, [jobId, simple_statefulNodeName, simple_statelessNodeName], 1);
            await checkEqualWithRetries(getThroughput, [jobId, simple_statefulNodeName, simple_statelessNodeName], 100);
            await stopPipeline(jobId)
        }).timeout(300 * 1000);

        it("should stabilize on 2 pods.", async () => {
            await createAlg(statefull);
            algList.push(statefull.name);
            await createAlg(stateless);
            algList.push(stateless.name);

            streamSimple.flowInput = createFlowInput_Simple({
                processTime: 1,
                programs: [
                    { rate: 1, time: 1 }
                ]
            });

            const res = await runRaw(streamSimple);
            const { jobId } = res.body;

            // Wait all nodes to be active
            await waitForStatus(jobId, simple_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(jobId, simple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);

            await intervalDelay('Waiting phase 1', 40 * 1000);
            const ratio = await getThroughput(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(ratio).to.be.gt(100); // suppose to be emptying the queue

            await intervalDelay('Waiting phase 2', 40 * 1000);
            await checkEqualWithRetries(getCurrentPods, [jobId, simple_statefulNodeName, simple_statelessNodeName], 2);
            await checkEqualWithRetries(getThroughput, [jobId, simple_statefulNodeName, simple_statelessNodeName], 100);
            await stopPipeline(jobId)
        }).timeout(300 * 1000);

        it("should stabilize on 21 pods.", async () => {
            await createAlg(statefull, 0.3);
            algList.push(statefull.name);
            await createAlg(stateless);
            algList.push(stateless.name);

            streamSimple.flowInput = createFlowInput_Simple({
                processTime: 1,
                programs: [
                    { rate: 20, time: 1 }
                ]
            });

            const res = await runRaw(streamSimple);
            const { jobId } = res.body;

            // Wait all nodes to be active
            await waitForStatus(jobId, simple_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(jobId, simple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);

            await intervalDelay('Waiting phase 1', 30 * 1000);
            const required =  await getRequiredPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(required).to.be.gt(21); // ideal amount, but queue is filled

            await intervalDelay('Waiting phase 2', 90 * 1000);
            const current =  await getCurrentPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(current).to.be.gt(21); // ideal amount, but queue is filled
            const ratio = await getThroughput(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(ratio).to.be.gt(100); // suppose to be emptying the queue

            await intervalDelay('Waiting phase 3', 120 * 1000);
            await checkEqualWithRetries(getCurrentPods, [jobId, simple_statefulNodeName, simple_statelessNodeName], 21);
            await checkEqualWithRetries(getThroughput, [jobId, simple_statefulNodeName, simple_statelessNodeName], 100);
            await stopPipeline(jobId)
        }).timeout(450 * 1000);
    });

    describe("simple pipeline test with changing ratios", () => {
        it("should scale up at first, then scale down to second rate.", async () => {
            await createAlg(statefull);
            algList.push(statefull.name);
            await createAlg(stateless);
            algList.push(stateless.name);

            streamSimple.flowInput = createFlowInput_Simple({
                programs: [
                    { rate: 150, time: 140 },
                    { rate: 50, time: 240 }
                ]
            });

            const res = await runRaw(streamSimple);
            const { jobId } = res.body;

            // Wait all nodes to be active
            await waitForStatus(jobId, simple_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            const statelessWaitingTime = await waitForStatus(jobId, simple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);

            await intervalDelay('Waiting phase 1', 145 * 1000 - statelessWaitingTime);
            let current = await getCurrentPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(current).to.be.gt(3);

            await intervalDelay('Waiting phase 2', 70 * 1000);
            current = await getCurrentPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(current).to.be.lt(3);
            await stopPipeline(jobId)
        }).timeout(400 * 1000);

        it("should scale up at first, then scale down to 0 and then back up.", async () => {
            await createAlg(statefull);
            algList.push(statefull.name);
            await createAlg(stateless);
            algList.push(stateless.name);

            streamSimple.flowInput = createFlowInput_Simple({
                programs: [
                    { rate: 150, time: 140 },
                    { rate: 0, time: 70 }
                ]
            });

            const res = await runRaw(streamSimple);
            const { jobId } = res.body;

            // Wait all nodes to be active
            await waitForStatus(jobId, simple_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            const statelessWaitingTime = await waitForStatus(jobId, simple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);

            await intervalDelay('Waiting phase 1', 140 * 1000 - statelessWaitingTime);
            let current = await getCurrentPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(current).to.be.gte(4);

            await intervalDelay('Waiting phase 2', 50 * 1000);
            current = await getCurrentPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(current).to.be.equal(0);

            await intervalDelay('Waiting phase 3', 75 * 1000);
            current = await getCurrentPods(jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(current).to.be.gt(0);
            await stopPipeline(jobId)
        }).timeout(450 * 1000);

        it("should satisfy the request rate with changing processing time.", async () => {
            await createAlg(statefull, 0.3);
            algList.push(statefull.name);
            await createAlg(statelessByInterval);
            algList.push(statelessByInterval.name);
            
            streamInterval.flowInput = createFlowInput_ByInterval({
                first_process_time: 1,
                second_process_time: 0.01,
                interval: 50,
                programs: [
                    { rate: 20, time: 1 }
                ]
            });

            const res = await runRaw(streamInterval);
            const { jobId } = res.body;

            // Wait all nodes to be active
            await waitForStatus(jobId, interval_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(jobId, interval_statelessNodeName, 'active', 120 * 1000, 2 * 1000);
            await intervalDelay('Waiting streaming to run for data to update', 30 * 1000);

            // Should get to required = 1 at some point.
            let attemptNumber = await checkEqualWithRetries(getRequiredPods, [jobId, multiple_statefulNodeName1, multiple_statelessNodeName], 1, 5 * 1000, 15);
            console.log(`Phase 1 passed at attempt number ${attemptNumber}.`);

            // Should get to required >= 20 required at some point.
            await checkInRangeWithRetries(getRequiredPods, [jobId, multiple_statefulNodeName1, multiple_statelessNodeName], 20, 50, 5 * 1000, 15);
            console.log(`Phase 2 passed at attempt number ${attemptNumber}.`);

            // Should get again to required = 1 at some point.
            await checkEqualWithRetries(getRequiredPods, [jobId, multiple_statefulNodeName1, multiple_statelessNodeName], 1, 5 * 1000, 15);
            console.log(`Phase 3 passed at attempt number ${attemptNumber}.`);
            await stopPipeline(jobId);
        }).timeout(450 * 1000);
    });

    describe("multiple streaming nodes pipeline tests", () => {
        it("should satisfy the request rate of 2 statefuls", async () => {
            await createAlg(statefull);
            algList.push(statefull.name);
            await createAlg(stateless);
            algList.push(stateless.name);

            streamMultiple.flowInput = createFlowInput_Simple({
                programs: [
                    { rate: 120, time: 50 }
                ]
            });

            const res = await runRaw(streamMultiple);
            const { jobId } = res.body;

            // Wait all nodes to be active
            await waitForStatus(jobId, multiple_statefulNodeName1, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(jobId, multiple_statefulNodeName2, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(jobId, multiple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);

            await intervalDelay('Wating phase 1', 30 * 1000);
            const required = await getRequiredPods(jobId, multiple_statefulNodeName1, multiple_statelessNodeName);
            expect(required).to.be.gt(5);

            await intervalDelay('Waiting phase 2', 30 * 1000);
            const current = await getCurrentPods(jobId, multiple_statefulNodeName1, multiple_statelessNodeName);
            const ratio1 = await getThroughput(jobId, multiple_statefulNodeName1, multiple_statelessNodeName);
            const ratio2 = await getThroughput(jobId, multiple_statefulNodeName2, multiple_statelessNodeName);
            expect(ratio1).to.be.gte(100); // suppose to be emptying the queue
            expect(ratio2).to.be.gte(100);
            expect(current).to.be.gt(5);

            await intervalDelay('Waiting phase 3', 60 * 1000)
            await checkEqualWithRetries(getCurrentPods, [jobId, multiple_statefulNodeName1, multiple_statelessNodeName], 5);
            await checkEqualWithRetries(getThroughput, [jobId, multiple_statefulNodeName1, multiple_statelessNodeName], 100);
            await checkEqualWithRetries(getThroughput, [jobId, multiple_statefulNodeName2, multiple_statelessNodeName], 100);
            await stopPipeline(jobId)
        }).timeout(400 * 1000);
    });

});
