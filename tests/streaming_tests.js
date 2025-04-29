const chai = require('chai');
const expect = chai.expect;
const config = require('../config/config');
const delay = require('delay');
const { StatusCodes } = require('http-status-codes');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);

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
    createFlowInput_ByInterval,
    combineFlows
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

const { pipe: streamDifferentFlows } = require("../additionalFiles/defaults/pipelines/stream-TwoStreamingNodesWithDifferentFlows");

const { alg: stateless } = require("../additionalFiles/defaults/algorithms/timeStateless");

const { alg: statelessByInterval } = require("../additionalFiles/defaults/algorithms/timeStatelessByInterval.js");

const simple_statefulNodeName = streamSimple.nodes.filter(node => node.stateType === 'stateful')[0].nodeName;
const simple_statelessNodeName = streamSimple.nodes.filter(node => node.stateType === 'stateless')[0].nodeName;

const interval_statefulNodeName = streamInterval.nodes.filter(node => node.stateType === 'stateful')[0].nodeName;
const interval_statelessNodeName = streamInterval.nodes.filter(node => node.stateType === 'stateless')[0].nodeName;

const multiple_statefulNodeName1 = streamMultiple.nodes.filter(node => node.stateType === 'stateful')[0].nodeName;
const multiple_statefulNodeName2 = streamMultiple.nodes.filter(node => node.stateType === 'stateful')[1].nodeName;
const multiple_statelessNodeName = streamMultiple.nodes.filter(node => node.stateType === 'stateless')[0].nodeName;

const differentFlows_statefulNodeName1 = streamDifferentFlows.nodes.filter(node => node.stateType === 'stateful')[0].nodeName;
const differentFlows_statefulNodeName2 = streamDifferentFlows.nodes.filter(node => node.stateType === 'stateful')[1].nodeName;
const differentFlows_statelessNodeName = streamDifferentFlows.nodes.filter(node => node.stateType === 'stateless')[0].nodeName;


describe("streaming pipeline test", () => {
    const algList = [];
    let dev_token;

    before(async function () {
        this.timeout(1000 * 60 * 15);
        let testUserBody ={
            username: config.keycloakDevUser,
            password: config.keycloakDevPass
        }
        const response = await chai.request(config.apiServerUrl)
        .post('/auth/login')
        .send(testUserBody)
        
        if (response.status === StatusCodes.OK) {
            console.log('dev login success');
            dev_token = response.body.token;
        }
        else {
            console.log('dev login failed - no keycloak/bad credentials');
        }
    });

    const createAlg = async (alg, cpu) => {
        await deleteAlgorithm(alg.name, dev_token, true);
        if (cpu) {
            alg.cpu = cpu - 0.001;
        }
        await storeAlgorithms(alg, dev_token);
        algList.push(alg.name);
    }

    beforeEach(function () {
        console.log('\n-----------------------------------------------\n');
    });

    after(async function () {
        this.timeout(2 * 60 * 1000);
        console.log("algList = " + algList);
        j = 0;
        z = 3;

        while (j < algList.length) {
            delAlg = algList.slice(j, z);
            const del = delAlg.map((e) => {
                return deleteAlgorithm(e, dev_token, true);
            });
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
        it("should satisfy the request rate with the given rate, with enough nodes", async () => {
            await createAlg(statefull);
            await createAlg(stateless);

            streamSimple.flowInput = createFlowInput_Simple({
                programs: [
                    { rate: 120, time: 50 }
                ]
            });

            const res = await runRaw(streamSimple, dev_token);
            const { jobId } = res.body;

            // Wait all nodes to be active
            await waitForStatus(dev_token, jobId, simple_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(dev_token, jobId, simple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);

            await intervalDelay('Waiting phase 1', 30 * 1000);
            const required = await getRequiredPods(dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(required).to.be.gt(3, `required is ${required}, needed >3`);

            await intervalDelay('Waiting phase 2', 30 * 1000);
            const current = await getCurrentPods(dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName);
            const throughput = await getThroughput(dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(throughput).to.be.gt(100, `throughput is ${throughput}, needed >100`); // suppose to be emptying the queue
            expect(current).to.be.gt(3, `current is ${current}, needed >3`);

            await intervalDelay('Waiting phase 3', 90 * 1000);
            await checkEqualWithRetries(getCurrentPods, [dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName], 3, 'Current pods');
            await checkInRangeWithRetries(getThroughput, [dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName], 99, 101, 'Throughput');
            await stopPipeline(jobId, dev_token);
        }).timeout(350 * 1000);

        it("should satisfy the high request rate with high rate, with enough nodes", async () => {
            await createAlg(statefull, 0.5);
            await createAlg(stateless);

            streamSimple.flowInput = createFlowInput_Simple({
                programs: [
                    { rate: 1200, time: 50 }
                ]
            });

            const res = await runRaw(streamSimple, dev_token);
            const { jobId } = res.body;

            // Wait all nodes to be active
            await waitForStatus(dev_token, jobId, simple_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(dev_token, jobId, simple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);

            await intervalDelay('Waiting phase 1', 30 * 1000);
            await checkInRangeWithRetries(getRequiredPods, [dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName], 27, Infinity, 'Required pods'); // ideal amount is 26, but queue is filled

            await intervalDelay('Waiting phase 2', 90 * 1000);
            await checkInRangeWithRetries(getCurrentPods, [dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName], 31, Infinity, 'Current pods', 15 * 1000, 5); // emptying queue
            await checkInRangeWithRetries(getThroughput, [dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName], 90, Infinity, 'Throughput');

            await intervalDelay('Waiting phase 3', 240 * 1000);
            // Suppose to have 26 pods, but might go to 24~27
            await checkInRangeWithRetries(getCurrentPods, [dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName], 24, 27, 'Current pods', 15 * 1000, 15);
            await checkInRangeWithRetries(getThroughput, [dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName], 98, 102, 'Throughput', 15 * 1000, 5);
            await stopPipeline(jobId, dev_token);
        }).timeout(700 * 1000);

        it("should stabilize on 1 pod", async () => {
            await createAlg(statefull);
            await createAlg(stateless);

            streamSimple.flowInput = createFlowInput_Simple({
                processTime: 0.95,
                programs: [
                    { rate: 1, time: 50 }
                ]
            });

            const res = await runRaw(streamSimple, dev_token);
            const { jobId } = res.body;

            // Wait all nodes to be active
            await waitForStatus(dev_token, jobId, simple_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(dev_token, jobId, simple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);

            await intervalDelay('Waiting phase 1', 40 * 1000);
            const current = await getCurrentPods(dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName);
            const throughput = await getThroughput(dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(throughput).to.be.gt(100, `throughput is ${throughput}, needed >100`); // suppose to be emptying the queue
            expect(current).to.be.gt(1, `current is ${current}, needed >1`);
            
            await intervalDelay('Waiting phase 2', 40 * 1000);
            await checkEqualWithRetries(getCurrentPods, [dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName], 1, 'Current pods');
            await checkEqualWithRetries(getThroughput, [dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName], 100, 'Throughput');
            await stopPipeline(jobId, dev_token);
        }).timeout(300 * 1000);

        it("should stabilize on 2 pods", async () => {
            await createAlg(statefull);
            await createAlg(stateless);

            streamSimple.flowInput = createFlowInput_Simple({
                processTime: 1,
                programs: [
                    { rate: 1, time: 1 }
                ]
            });

            const res = await runRaw(streamSimple, dev_token);
            const { jobId } = res.body;

            // Wait all nodes to be active
            await waitForStatus(dev_token, jobId, simple_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(dev_token, jobId, simple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);

            await intervalDelay('Waiting phase 1', 40 * 1000);
            await checkInRangeWithRetries(getThroughput, [dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName], 100, Infinity, 'Throughput'); // suppose to be emptying the queue

            await intervalDelay('Waiting phase 2', 40 * 1000);
            await checkEqualWithRetries(getCurrentPods, [dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName], 2, 'Current pods');
            await checkEqualWithRetries(getThroughput, [dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName], 100, 'Throughput');
            await stopPipeline(jobId, dev_token);
        }).timeout(300 * 1000);

        it("should stabilize on 21 pods", async () => {
            await createAlg(statefull, 0.3);
            await createAlg(stateless);

            streamSimple.flowInput = createFlowInput_Simple({
                processTime: 1,
                programs: [
                    { rate: 20, time: 1 }
                ]
            });

            const res = await runRaw(streamSimple, dev_token);
            const { jobId } = res.body;

            // Wait all nodes to be active
            await waitForStatus(dev_token, jobId, simple_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(dev_token, jobId, simple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);

            await intervalDelay('Waiting phase 1', 30 * 1000);
            await checkInRangeWithRetries(getRequiredPods, [dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName], 22, Infinity, 'Required');  // ideal amount is 21, but queue is filled

            await intervalDelay('Waiting phase 2', 60 * 1000);
            const current =  await getCurrentPods(dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(current).to.be.gt(21, `current is ${current}, needed >21`); // ideal amount, but queue is filled
            const throughput = await getThroughput(dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(throughput).to.be.gt(100, `throughput is ${throughput}, needed >100`); // suppose to be emptying the queue

            await intervalDelay('Waiting phase 3', 150 * 1000);
            await checkEqualWithRetries(getCurrentPods, [dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName], 21, 'Current pods');
            await checkEqualWithRetries(getThroughput, [dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName], 100, 'Throughput');
            await stopPipeline(jobId, dev_token);
        }).timeout(450 * 1000);
    });

    describe("simple pipeline test with changing ratios", () => {
        it("should scale up at first, then scale down to second rate", async () => {
            await createAlg(statefull);
            await createAlg(stateless);

            streamSimple.flowInput = createFlowInput_Simple({
                programs: [
                    { rate: 150, time: 140 },
                    { rate: 50, time: 240 }
                ]
            });

            const res = await runRaw(streamSimple, dev_token);
            const { jobId } = res.body;

            // Wait all nodes to be active
            await waitForStatus(dev_token, jobId, simple_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            const statelessWaitingTime = await waitForStatus(dev_token, jobId, simple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);

            await intervalDelay('Waiting phase 1', 145 * 1000 - statelessWaitingTime);
            let current = await getCurrentPods(dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(current).to.be.gt(3, `current is ${current}, needed >3`);

            await intervalDelay('Waiting phase 2', 70 * 1000);
            current = await getCurrentPods(dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(current).to.be.lt(3, `current is ${current}, needed <3`);
            await stopPipeline(jobId, dev_token);
        }).timeout(400 * 1000);

        it("should scale up at first, then scale down to 0 and then back up", async () => {
            await createAlg(statefull);
            await createAlg(stateless);

            streamSimple.flowInput = createFlowInput_Simple({
                programs: [
                    { rate: 150, time: 140 },
                    { rate: 0, time: 70 }
                ]
            });

            const res = await runRaw(streamSimple, dev_token);
            const { jobId } = res.body;

            // Wait all nodes to be active
            await waitForStatus(dev_token, jobId, simple_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            const statelessWaitingTime = await waitForStatus(dev_token, jobId, simple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);

            await intervalDelay('Waiting phase 1', 140 * 1000 - statelessWaitingTime);
            let current = await getCurrentPods(dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(current).to.be.gte(4, `current is ${current}, needed >=4`);

            await intervalDelay('Waiting phase 2', 50 * 1000);
            await checkEqualWithRetries(getCurrentPods, [dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName], 0,'Current pods', 5 * 1000, 4);

            await intervalDelay('Waiting phase 3', 75 * 1000);
            current = await getCurrentPods(dev_token, jobId, simple_statefulNodeName, simple_statelessNodeName);
            expect(current).to.be.gt(0, `current is ${current}, needed >0`);
            await stopPipeline(jobId, dev_token);
        }).timeout(450 * 1000);

        it("should satisfy the request rate with changing processing time", async () => {
            await createAlg(statefull, 0.3);
            await createAlg(statelessByInterval);
            
            streamInterval.flowInput = createFlowInput_ByInterval({
                first_process_time: 1,
                second_process_time: 0.01,
                interval: 50,
                programs: [
                    { rate: 20, time: 1 }
                ]
            });

            const res = await runRaw(streamInterval, dev_token);
            const { jobId } = res.body;

            // Wait all nodes to be active
            await waitForStatus(dev_token, jobId, interval_statefulNodeName, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(dev_token, jobId, interval_statelessNodeName, 'active', 120 * 1000, 2 * 1000);
            await intervalDelay('Waiting streaming to run for data to update', 30 * 1000);

            // Should get to required = 1 at some point.
            let { attempt: attempt1 } = await checkEqualWithRetries(getRequiredPods, [dev_token, jobId, multiple_statefulNodeName1, multiple_statelessNodeName], 1, 'Required pods', 5 * 1000, 15);
            console.log(`Phase 1 passed at attempt number ${attempt1}.`);

            // Should get to required >= 20 required at some point.
            let { attempt: attempt2 } = await checkInRangeWithRetries(getRequiredPods, [dev_token, jobId, multiple_statefulNodeName1, multiple_statelessNodeName], 20, 50, 'Required pods', 5 * 1000, 20);
            console.log(`Phase 2 passed at attempt number ${attempt2}.`);

            // Should get again to required = 1 at some point.
            let { attempt: attempt3 } = await checkEqualWithRetries(getRequiredPods, [dev_token, jobId, multiple_statefulNodeName1, multiple_statelessNodeName], 1, 'Required pods', 5 * 1000, 15);
            console.log(`Phase 3 passed at attempt number ${attempt3}.`);
            await stopPipeline(jobId, dev_token);
        }).timeout(450 * 1000);
    });

    describe("multiple streaming nodes pipeline tests", () => {
        it("should satisfy the request rate of 2 statefuls", async () => {
            await createAlg(statefull);
            await createAlg(stateless);

            streamMultiple.flowInput = createFlowInput_Simple({
                programs: [
                    { rate: 120, time: 50 }
                ]
            });

            const res = await runRaw(streamMultiple, dev_token);
            const { jobId } = res.body;

            // Wait all nodes to be active
            await waitForStatus(dev_token, jobId, multiple_statefulNodeName1, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(dev_token, jobId, multiple_statefulNodeName2, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(dev_token, jobId, multiple_statelessNodeName, 'active', 120 * 1000, 2 * 1000);

            await intervalDelay('Waiting phase 1', 30 * 1000);
            const required = await getRequiredPods(dev_token, jobId, multiple_statefulNodeName1, multiple_statelessNodeName);
            expect(required).to.be.gt(5, `required is ${required}, needed >5`);

            await intervalDelay('Waiting phase 2', 20 * 1000);
            const current = await getCurrentPods(dev_token, jobId, multiple_statefulNodeName1, multiple_statelessNodeName);
            const throughput1 = await getThroughput(dev_token, jobId, multiple_statefulNodeName1, multiple_statelessNodeName);
            const throughput2 = await getThroughput(dev_token, jobId, multiple_statefulNodeName2, multiple_statelessNodeName);
            expect(throughput1).to.be.gte(100, `throughput1 is ${throughput1}, needed >=100`); // suppose to be emptying the queue
            expect(throughput2).to.be.gte(100, `throughput is ${throughput2}, needed >=100`);
            expect(current).to.be.gt(5, `current is ${current}, needed >5`);

            await intervalDelay('Waiting phase 3', 90 * 1000);
            await checkEqualWithRetries(getCurrentPods, [dev_token, jobId, multiple_statefulNodeName1, multiple_statelessNodeName], 5, 'Current pods');
            await checkEqualWithRetries(getThroughput, [dev_token, jobId, multiple_statefulNodeName1, multiple_statelessNodeName], 100, 'Throughput');
            await checkEqualWithRetries(getThroughput, [dev_token, jobId, multiple_statefulNodeName2, multiple_statelessNodeName], 100, 'Throughput');
            await stopPipeline(jobId, dev_token);
        }).timeout(400 * 1000);

        it("should satisfy the request rate of 2 statefuls, each with different rate", async () => {
            await createAlg(statefull);
            await createAlg(stateless);

            const flow1Config = {
                programs: [
                    { rate: 120, time: 50 }
                ]
            };
            const flow2Config = {
                flowName: "hkube_desc2",
                programs: [
                    { rate: 60, time: 50 }
                ]
            };
            streamDifferentFlows.flowInput = combineFlows([flow1Config, flow2Config]);

            const res = await runRaw(streamDifferentFlows, dev_token);
            const { jobId } = res.body;

            // Wait all nodes to be active
            await waitForStatus(dev_token, jobId, differentFlows_statefulNodeName1, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(dev_token, jobId, differentFlows_statefulNodeName2, 'active', 60 * 1000, 2 * 1000);
            await waitForStatus(dev_token, jobId, differentFlows_statelessNodeName, 'active', 120 * 1000, 2 * 1000);

            await intervalDelay('Waiting phase 1', 30 * 1000);
            const required = await getRequiredPods(dev_token, jobId, multiple_statefulNodeName1, multiple_statelessNodeName);
            expect(required).to.be.gt(2, `required is ${required}, needed >2`);

            await intervalDelay('Waiting phase 2', 30 * 1000);
            const current = await getCurrentPods(dev_token, jobId, multiple_statefulNodeName1, multiple_statelessNodeName);
            const throughput1 = await getThroughput(dev_token, jobId, multiple_statefulNodeName1, multiple_statelessNodeName);
            const throughput2 = await getThroughput(dev_token, jobId, multiple_statefulNodeName2, multiple_statelessNodeName);
            expect(throughput1).to.be.gte(100, `throughput1 is ${throughput1}, needed >=100`); // suppose to be emptying the queue
            expect(throughput2).to.be.gte(100, `throughput is ${throughput2}, needed >=100`);
            expect(current).to.be.gte(2, `current is ${current}, needed >=2`);

            await intervalDelay('Waiting phase 3', 60 * 1000);
            await checkEqualWithRetries(getCurrentPods, [dev_token, jobId, multiple_statefulNodeName1, multiple_statelessNodeName], 2, 'Current pods');
            await checkEqualWithRetries(getThroughput, [dev_token, jobId, multiple_statefulNodeName1, multiple_statelessNodeName], 100, 'Throughput');
            await checkEqualWithRetries(getThroughput, [dev_token, jobId, multiple_statefulNodeName2, multiple_statelessNodeName], 100, 'Throughput');
            await stopPipeline(jobId, dev_token);
        }).timeout(400 * 1000);
    });
});
