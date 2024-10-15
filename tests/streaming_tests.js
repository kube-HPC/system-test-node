const chai = require('chai');
const expect = chai.expect;
const delay = require('delay');
const path = require('path')



// const axios = require('axios')
const {
    deleteAlgorithm,
    storeAlgorithms,
    getAlgorithim } = require('../utils/algorithmUtils')

const {
    getRawGraph
} = require('../utils/results');

// const KubernetesClient = require('@hkube/kubernetes-client').Client;
const {
    runRaw,
    stopPipeline
} = require('../utils/pipelineUtils')

const {
    getResult
} = require('../utils/results')

const {
    getCurrentPods,
    getRequiredPods,
    getThroughput,
    waitForStatus } = require('../utils/streamingUtils')

const { alg: statefull } = require("../additionalFiles/defaults/algorithms/timeStartstream")

const { pipe1: streamSimple } = require("../additionalFiles/defaults/pipelines/stream-simple");

const { alg: stateless } = require("../additionalFiles/defaults/algorithms/timeStateless")

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

    describe("time tests", () => {
        it("should satisfy the request rate with high rate, with enough nodes.", async () => {
            await createAlg(statefull);
            algList.push(statefull.name);
            try {
                await createAlg(stateless);
                algList.push(stateless.name);
            }
            catch (e) {
                e.printSackTrace();
            }

            streamSimple.flowInput = {
                "flows": [
                    {
                        "name": "hkube_desc",
                        "program": [
                            {
                                "rate": 120,
                                "time": 50,
                                "size": 80
                            }
                        ]
                    }
                ],
                "process_time": 0.02
            }

            const res = await runRaw(streamSimple);
            const { jobId } = res.body;
            await waitForStatus(jobId, 'sen-1', 'active', 60000, 2000);
            console.log("sen-1 is active")
            await waitForStatus(jobId, 'sen-out-1', 'active', 120000, 2000);
            console.log("sen-out-1 is active")
            await delay(120 * 1000);
            const required = await getRequiredPods(jobId, 'sen-1', 'sen-out-1');
            expect(required).to.be.gt(2);
            await delay(60 * 1000)
            const current = await getCurrentPods(jobId, 'sen-1', 'sen-out-1');
            expect(current).to.be.gt(2);
            const ratio = await getThroughput(jobId, 'sen-1', 'sen-out-1');
            expect(ratio).to.be.gt(90);
            expect(current).to.be.lt(4);
            await stopPipeline(jobId)
        }).timeout(250 * 1000);

        it("Should scale up at first, then scale down to second rate.", async () => {
            await createAlg(statefull);
            algList.push(statefull.name);
            try {
                await createAlg(stateless);
                algList.push(stateless.name);
            }
            catch (e) {
                e.printSackTrace();
            }

            streamSimple.flowInput = {
                "flows": [
                    {
                        "name": "hkube_desc",
                        "program": [
                            {
                                "rate": 150,
                                "time": 140,
                                "size": 80
                            },
                            {
                                "rate": 50,
                                "time": 240,
                                "size": 80
                            }
                        ]
                    }
                ],
                "process_time": 0.02
            }

            const res = await runRaw(streamSimple);
            const { jobId } = res.body;
            await waitForStatus(jobId, 'sen-1', 'active', 60 * 1000, 2000);
            console.log("sen-1 is active")
            await waitForStatus(jobId, 'sen-out-1', 'active', 60 * 1000, 2000);
            console.log("sen-out-1 is active")
            await delay(125 * 1000);
            let required = await getRequiredPods(jobId, 'sen-1', 'sen-out-1');
            expect(required).to.be.gt(3);
            await delay(160 * 1000);
            required = await getRequiredPods(jobId, 'sen-1', 'sen-out-1');
            expect(required).to.be.lt(3);
            await stopPipeline(jobId)
        }).timeout(400 * 1000);

        it("should scale up at first, then scale down to 0 and then back up.", async () => {
            await createAlg(statefull);
            algList.push(statefull.name);
            try {
                await createAlg(stateless);
                algList.push(stateless.name);
            }
            catch (e) {
                e.printSackTrace();
            }

            streamSimple.flowInput = {
                "flows": [
                    {
                        "name": "hkube_desc",
                        "program": [
                            {
                                "rate": 150,
                                "time": 140,
                                "size": 80
                            },
                            {
                                "rate": 0,
                                "time": 240,
                                "size": 80
                            }
                        ]
                    }
                ],
                "process_time": 0.02
            }

            const res = await runRaw(streamSimple);
            const { jobId } = res.body;
            await waitForStatus(jobId, 'sen-1', 'active', 60 * 1000, 2000);
            console.log("sen-1 is active")
            await waitForStatus(jobId, 'sen-out-1', 'active', 60 * 1000, 2000);
            console.log("sen-out-1 is active")
            await delay(125 * 1000);
            let required = await getRequiredPods(jobId, 'sen-1', 'sen-out-1');
            expect(required).to.be.gt(3);
            await delay(160 * 1000);
            required = await getRequiredPods(jobId, 'sen-1', 'sen-out-1');
            expect(required).to.be.equal(0);
            await delay(160 * 1000);
            required = await getRequiredPods(jobId, 'sen-1', 'sen-out-1');
            expect(required).to.be.gt(0);
            await stopPipeline(jobId)
        }).timeout(550 * 1000);

        it("should satisfy the high request rate with high rate, with enough nodes.", async () => {
            await createAlg(statefull, 0.3);
            algList.push(statefull.name);
            try {
                await createAlg(stateless);
                algList.push(stateless.name);
            }
            catch (e) {
                e.printSackTrace();
            }

            streamSimple.flowInput = {
                "flows": [
                    {
                        "name": "hkube_desc",
                        "program": [
                            {
                                "rate": 1200, // rate of request per second
                                "time": 50, // for how long this rate will continue, once done going to next one (unless it's the only one, then back to it)
                                "size": 80 // size of each message
                            }
                        ]
                    }
                ],
                "process_time": 0.02 // process time per message
            }

            const res = await runRaw(streamSimple);
            const { jobId } = res.body;
            await waitForStatus(jobId, 'sen-1', 'active', 60000, 2000);
            console.log("sen-1 is active")
            await waitForStatus(jobId, 'sen-out-1', 'active', 120000, 2000);
            console.log("sen-out-1 is active")
            await delay(120 * 1000);
            const required = await getRequiredPods(jobId, 'sen-1', 'sen-out-1');
            expect(required).to.be.gt(26); // ideal amount, but queue is filled
            await delay(90 * 1000)
            let current = await getCurrentPods(jobId, 'sen-1', 'sen-out-1');
            expect(current).to.be.gt(30);
            let ratio = await getThroughput(jobId, 'sen-1', 'sen-out-1');
            expect(ratio).to.be.gt(90);
            await delay(240 * 1000);
            // Suppose to have 26 pods (not 24 since traffic), but might go to 24~28
            current = await getCurrentPods(jobId, 'sen-1', 'sen-out-1');
            expect(current).to.be.lt(29);
            expect(current).to.be.gt(23);
            ratio = await getThroughput(jobId, 'sen-1', 'sen-out-1');
            expect(ratio).to.be.gt(90);
            await stopPipeline(jobId)
        }).timeout(580 * 1000);

        it.only("should stabilize on 21 pods.", async () => {
            await createAlg(statefull, 0.3);
            algList.push(statefull.name);
            try {
                await createAlg(stateless);
                algList.push(stateless.name);
            }
            catch (e) {
                e.printSackTrace();
            }

            streamSimple.flowInput = {
                "flows": [
                    {
                        "name": "hkube_desc",
                        "program": [
                            {
                                "rate": 20,
                                "time": 1,
                                "size": 80
                            }
                        ]
                    }
                ],
                "process_time": 1
            }

            const res = await runRaw(streamSimple);
            const { jobId } = res.body;
            await waitForStatus(jobId, 'sen-1', 'active', 60000, 2000);
            console.log("sen-1 is active")
            await waitForStatus(jobId, 'sen-out-1', 'active', 120000, 2000);
            console.log("sen-out-1 is active")
            await delay(120 * 1000);
            const required =  await getRequiredPods(jobId, 'sen-1', 'sen-out-1');
            expect(required).to.be.gt(20); // ideal amount, but queue is filled
            let current = await getCurrentPods(jobId, 'sen-1', 'sen-out-1');
            let ratio = await getThroughput(jobId, 'sen-1', 'sen-out-1');
            expect(ratio).to.be.gt(100); // suppose to be emptying the queue
            await delay(90 * 1000);
            current = await getCurrentPods(jobId, 'sen-1', 'sen-out-1');
            expect(current).to.be.equal(21);
            ratio = await getThroughput(jobId, 'sen-1', 'sen-out-1');
            // ratio suppose to be around 100%
            expect(ratio).to.be.gt(98);
            expect(ratio).to.be.lt(102);
            await stopPipeline(jobId)
        }).timeout(300 * 1000);
    });


});
