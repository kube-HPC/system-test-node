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

// const {

//     getRawGraph
// } = require('../utils/results')

// const KubernetesClient = require('@hkube/kubernetes-client').Client;
const {
    getExecPipeline,
    runRaw, stopPipeline
} = require('../utils/pipelineUtils')

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
    const getResult = async (jobId, expectedStatus, timeout = 60 * 1000 * 10, interval = 5000) => {

        if (typeof jobId != 'string') {
            jobId = jobId.body.jobId
        }

        const start = Date.now();
        do {
            process.stdout.write('.')
            const res = await getJobResult(jobId)
            if (res.status === expectedStatus) {
                return res.body;
            }
            await delay(interval);
        } while (Date.now() - start < timeout);
        expect.fail(`timeout exceeded trying to get ${expectedStatus} status in result for jobId ${jobId}`);
    };

    /**
     * Waits for a specific status of a node in a job graph, polling at intervals, until a timeout is reached.
     * 
     * @param {string} jobId - The ID of the job whose graph is being monitored.
     * @param {string} nodeName - The name of the node to monitor for the expected status.
     * @param {string} expectedStatus - The status value to wait for (e.g., 'active', 'completed').
     * @param {number} [timeout=600000] - Optional. The maximum time to wait for the status in milliseconds (default is 10 minutes).
     * @param {number} [interval=5000] - Optional. The polling interval in milliseconds (default is 5 seconds).
     * 
     * @returns {Promise<boolean>} Resolves to `true` if the expected status is found before timeout, otherwise fails the test.
     * @throws Will throw an error if the expected status is not achieved within the timeout.
     */
    const waitForStatus = async (jobId, nodeName, expectedStatus, timeout = 60 * 1000 * 10, interval = 5000) => {
        const start = Date.now();
        do {
            process.stdout.write('.')
            let { body: graph } = await getRawGraph(jobId);
            const filtered = graph.nodes.filter(node => node.nodeName === nodeName);
            if (filtered.length > 0) {
                const node = filtered[0];
                if (node.batch) {
                    const activeTask = node.batch.filter((task) => task.status === expectedStatus);
                    if (activeTask)
                        return true;
                }
                else if (node.status === expectedStatus) {
                        return true;
                }
            }
            await delay(interval);
        } while (Date.now() - start < timeout);
        expect.fail(`timeout exceeded trying to get ${expectedStatus} status in result for node ${nodeName}`);
    }

    /**
     * Retrieves the number of active pods for a specific node in a job graph.
     * 
     * @param {object} graph - The job graph containing nodes and edges.
     * @param {string} nodeName - The name of the node to check for active pods.
     * 
     * @returns {number} The number of active pods for the specified node.
     */
    const getNumActivePods = (graph, nodeName) => {
        const filtered = graph.nodes.filter(node => node.nodeName === nodeName);
        if (filtered.length > 0) {
            const node = filtered[0];
            if (node.batch) {
                return node.batch.filter(task => task.status === 'active').length;
            } else if (node.status === 'active') {
                return 1;
            }
            }
            return 0;
        }

    /**
     * Retrieves the request rate between two nodes in a job graph.
     * 
     * @param {string} jobId - The ID of the job whose graph is being queried.
     * @param {string} source - The source node.
     * @param {string} target - The target node.
     * 
     * @returns {Promise<number>} The request rate between the source and target nodes.
     */
    const getRequestRate = async (jobId, source, target) => {

        let { body: graph } = await getRawGraph(jobId);
        const filtered = graph.edges.filter(edge => edge.from === source && edge.to === target);
        const metrics = filtered[0]?.value['metrics'];
        return metrics.reqRate;

    }

    /**
     * Retrieves the current number of pods between two nodes in a job graph.
     * 
     * @param {string} jobId - The ID of the job whose graph is being queried.
     * @param {string} source - The source node.
     * @param {string} target - The target node.
     * 
     * @returns {Promise<number>} The current number of pods between the source and target nodes.
     */
    const getCurrentPods = async (jobId, source, target) => {
        let { body: graph } = await getRawGraph(jobId);
        const filtered = graph.edges.filter(edge => edge.from === source && edge.to === target);
        const metrics = filtered[0]?.value['metrics'];
        return metrics.currentSize;

    }

    /**
     * Retrieves the response rate between two nodes in a job graph.
     * 
     * @param {string} jobId - The ID of the job whose graph is being queried.
     * @param {string} source - The source node.
     * @param {string} target - The target node.
     * 
     * @returns {Promise<number>} The response rate between the source and target nodes.
     */
    const getResponseRate = async (jobId, source, target) => {
        let { body: graph } = await getRawGraph(jobId);
        const filtered = graph.edges.filter(edge => edge.from === source && edge.to === target);
        const metrics = filtered[0]?.value['metrics'];
        return metrics.resRate;
    }

    /**
     * Retrieves the required number of pods between two nodes in a job graph.
     * 
     * @param {string} jobId - The ID of the job whose graph is being queried.
     * @param {string} source - The source node.
     * @param {string} target - The target node.
     * 
     * @returns {Promise<number>} The required number of pods between the source and target nodes.
     */
    const getRequiredPods = async (jobId, source, target) => {
        let { body: graph } = await getRawGraph(jobId);
        const filtered = graph.edges.filter(edge => edge.from === source && edge.to === target);
        const metrics = filtered[0]?.value['metrics'];
        return metrics.required;
    }


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
            const reqRate = await getRequestRate(jobId, 'sen-1', 'sen-out-1');
            const resRate = await getResponseRate(jobId, 'sen-1', 'sen-out-1');
            const current = await getCurrentPods(jobId, 'sen-1', 'sen-out-1');
            expect(current).to.be.gt(2);
            const ratio = (resRate * 10) / reqRate;
            expect(ratio).to.be.gt(9);
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
            await waitForStatus(jobId, 'sen-1', 'active', 60000, 2000);
            console.log("sen-1 is activce")
            await delay(140);
            await waitForStatus(jobId, 'sen-out-1', 'active', 60000, 2000);
            console.log("sen-out-1 is activce")
            await delay(5);
            let required = await getRequiredPods(jobId, 'sen-1', 'sen-out-1');
            expect(required).to.be.gt(3);
            await delay(160);
            required = await getRequiredPods(jobId, 'sen-1', 'sen-out-1');
            expect(required).to.be.lt(3);
            await stopPipeline(jobId)
        }).timeout(180000);

    });


});

















// describe('gateway api tests', () => {
//     const pipe = {

//         "name": "raw-gateway-test",
//         "kind": "stream",
//         "nodes": [
//             {
//                 "nodeName": "A",
//                 "kind": "gateway",
//                 "spec": {
//                     "name": "raw-image-gateway",
//                     "description": "images streaming source",
//                     "cpu": 0.1,
//                     "mem": "512Mi"
//                 },
//                 "input": [],
//                 "stateType": "stateful"
//             },
//             {
//                 "nodeName": "B",
//                 "algorithmName": "green-alg",
//                 "input": [
//                     {
//                         "delay": 0.01
//                     }
//                 ],
//                 "kind": "algorithm",
//                 "stateType": "stateless"
//             }
//         ],
//         "streaming": {
//             "flows": {
//                 "analyze": "A >> B"
//             }
//         },
//         "experimentName": "main",
//         "options": {
//             "ttl": 3600,
//             "batchTolerance": 80,
//             "progressVerbosityLevel": "info"
//         },
//         "priority": 3
//     }



//     it("send message to gateway", async () => {
//         const res = await runRaw(pipe)
//         const jobId = res.body.jobId


//         const exec = await getExecPipeline(jobId)
//         const url = exec.body.streaming.gateways[0].url
//         console.log(`url = https://cicd-test.hkube.org/${url}/streaming/info`);
//         await delay(20000)
//         const status = await axios.get(`https://cicd-test.hkube.org/${url}/streaming/info`)
//         //const res = await axios.post(`${config.DsServerUrl}/${DsName}/snapshot`,snap)

//         const data = { "test": 1 }
//         console.log("starts loop")
//         for (i = 0; i < 15; i++) {
//             const message = await axios.post(`https://cicd-test.hkube.org/${url}/streaming/message`, data)
//             console.log(message.data)
//         }


//         await delay(80000)
//         const graph = await getRawGraph(jobId)

//         const q = JSON.parse(graph.text).edges[0].value.metrics.totalRequests

//         const t = JSON.parse(graph.text).edges[0].value.metrics.totalResponses
//         console.log(`send ${q} recieved ${t}`)
//         // const stop = await stopPipeline(jobId)
//         console.log("stop")
//         expect(t).to.be.equal(q)
//     }).timeout(1000 * 60 * 7);


//     it("send message to gateway jobid", async () => {


//         const url = "hkube/gateway/gateway"//"hkube/gateway/raw-image-gateway"
//         const status = await axios.get(`https://cicd-test.hkube.org/${url}/streaming/info`)
//         //const res = await axios.post(`${config.DsServerUrl}/${DsName}/snapshot`,snap)

//         const data = { "test": 1 }
//         let jnk = await axios.post(`https://cicd-test.hkube.org/${url}/streaming/message`, data)
//         console.log("starts loop")
//         for (i = 0; i < 1; i++) {
//             const message = await axios.post(`https://cicd-test.hkube.org/${url}/streaming/message`, data)
//             console.log(message.data)
//         }

//         //https://cicd-test.hkube.org/hkube/gateway/raw-images-gateway/swagger-ui/
//         //await delay(80000)
//         //     const graph = await getRawGraph(jobId)

//         //     const q= JSON.parse(graph.text).edges[0].value.metrics.totalRequests

//         //     const t = JSON.parse(graph.text).edges[0].value.metrics.totalResponses
//         //     console.log(`send ${q} recieved ${t}`)
//         //    // const stop = await stopPipeline(jobId)
//         console.log("stop")
//         //expect(t).to.be.equal(q)
//     }).timeout(1000 * 60 * 7);

//     const sendMessage = async (data) => {
//         const url = "hkube/gateway/raw-image-gateway"
//         const jnk = await axios.post(`https://cicd-test.hkube.org/${url}/streaming/message`, data)
//         return jnk;
//     }


//     it("jnk", () => {

//         const jjjj = {
//             a: 1,
//             b: ["a", "b", "c", "d", "a", "b"]
//         }

//         const h = new Set(jjjj.b)

//         for (const [i, jj] of jjjj.b.entries()) {
//             console.log(i)
//             console.log(jj)
//         }


//     })
//     it("", async () => {

//         const interval = setInterval(() => {
//             [...Array(5).keys()].forEach(k => {

//                 let message = { "data": 1 }

//                 sendMessage(message)
//             })
//         }, 1000);
//         console.log(`start sleep - interval= ${interval}`);
//         await delay(120 * 1000)

//         clearInterval(interval)
//         console.log(`stop  - interval= ${interval}`);
//     }).timeout(1000 * 60 * 60)

// });


