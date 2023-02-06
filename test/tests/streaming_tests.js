const chai = require('chai');
const expect = chai.expect;
const delay = require('delay');
const path = require('path')


const axios = require('axios')
const { runAlgorithm,
    deleteAlgorithm,
    storeAlgorithm,
    StoreDebugAlgorithm,
    getAlgorithm,
    getAlgorithmVersion,
    updateAlgorithmVersion,
    storeAlgorithmApplay,
    deleteAlgorithmVersion,
    getAlgorithim } = require('../../utils/algorithmUtils')

const {
    getWebSocketJobs,
    getWebSocketlogs,
    getDriverIdByJobId
} = require('../../utils/socketGet')


const {
    getJobIdsTree,
    getResult,
    getCronResult,
    getRawGraph
} = require('../../utils/results')

// const KubernetesClient = require('@hkube/kubernetes-client').Client;
const {
    getExecPipeline,
    loadRunStored,
    getPipelineTriggerTree,
    getPending,
    getActive,
    runRaw,
    deletePipeline,
    pipelineRandomName,
    getPipelineStatus,
    storePipeline,
    runStored,
    deconstructTestData,
    runStoredAndWaitForResults,
    resumePipeline,
    pausePipeline,
    stopPipeline,
    exceCachPipeline,
    getPipelinestatusByName
} = require('../../utils/pipelineUtils')


describe('streaming pipeline test', () => {

    describe('gateway api tests', () => {
        const pipe = {

            "name": "raw-gateway-test",
            "kind": "stream",
            "nodes": [
                {
                    "nodeName": "A",
                    "kind": "gateway",
                    "spec": {
                        "name": "raw-image-gateway",
                        "description": "images streaming source",
                        "cpu": 1,
                        "mem": "1Gi"
                    },
                    "input": [],
                    "stateType": "stateful"
                },
                {
                    "nodeName": "B",
                    "algorithmName": "green-alg",
                    "input": [
                        {
                            "delay": 0.01
                        }
                    ],
                    "kind": "algorithm",
                    "stateType": "stateless"
                }
            ],
            "streaming": {
                "flows": {
                    "analyze": "A >> B"
                }
            },
            "experimentName": "main",
            "options": {
                "ttl": 3600,
                "batchTolerance": 80,
                "progressVerbosityLevel": "info"
            },
            "priority": 3
        }



        it("send message to gateway", async () => {
            const res = await runRaw(pipe)
            const jobId = res.body.jobId


            const exec = await getExecPipeline(jobId)
            const url = exec.body.streaming.gateways[0].url
            console.log(`url = https://test.hkube.io/${url}/streaming/info`);
            await delay(20000)
            const status = await axios.get(`https://test.hkube.io/${url}/streaming/info`)
            //const res = await axios.post(`${config.DsServerUrl}/${DsName}/snapshot`,snap)

            const data = { "test": 1 }
            console.log("starts loop")
            for (i = 0; i < 15; i++) {
                const message = await axios.post(`https://test.hkube.io/${url}/streaming/message`, data)
                console.log(message.data)
            }


            await delay(80000)
            const graph = await getRawGraph(jobId)

            const q = JSON.parse(graph.text).edges[0].value.metrics.totalRequests

            const t = JSON.parse(graph.text).edges[0].value.metrics.totalResponses
            console.log(`send ${q} recieved ${t}`)
            // const stop = await stopPipeline(jobId)
            console.log("stop")
            expect(t).to.be.equal(q)
        }).timeout(1000 * 60 * 7);


        it("send message to gateway jobid", async () => {


            const url = "hkube/gateway/gateway"//"hkube/gateway/raw-image-gateway"
            const status = await axios.get(`https://test.hkube.io/${url}/streaming/info`)
            //const res = await axios.post(`${config.DsServerUrl}/${DsName}/snapshot`,snap)

            const data = { "test": 1 }
            let jnk = await axios.post(`https://test.hkube.io/${url}/streaming/message`, data)
            console.log("starts loop")
            for (i = 0; i < 1; i++) {
                const message = await axios.post(`https://test.hkube.io/${url}/streaming/message`, data)
                console.log(message.data)
            }

            //https://test.hkube.io/hkube/gateway/raw-images-gateway/swagger-ui/
            //await delay(80000)
            //     const graph = await getRawGraph(jobId)

            //     const q= JSON.parse(graph.text).edges[0].value.metrics.totalRequests

            //     const t = JSON.parse(graph.text).edges[0].value.metrics.totalResponses
            //     console.log(`send ${q} recieved ${t}`)
            //    // const stop = await stopPipeline(jobId)
            console.log("stop")
            //expect(t).to.be.equal(q)
        }).timeout(1000 * 60 * 7);

        const sendMessage = async (data) => {
            const url = "hkube/gateway/raw-image-gateway"
            const jnk = await axios.post(`https://test.hkube.io/${url}/streaming/message`, data)
            return jnk;
        }


        it("jnk", () => {

            const jjjj = {
                a: 1,
                b: ["a", "b", "c", "d", "a", "b"]
            }

            const h = new Set(jjjj.b)

            for (const [i, jj] of jjjj.b.entries()) {
                console.log(i)
                console.log(jj)
            }


        })
        it("", async () => {

            const interval = setInterval(() => {
                [...Array(5).keys()].forEach(k => {

                    let message = { "data": 1 }

                    sendMessage(message)
                })
            }, 1000);
            console.log(`start sleep - interval= ${interval}`);
            await delay(120 * 1000)

            clearInterval(interval)
            console.log(`stop  - interval= ${interval}`);
        }).timeout(1000 * 60 * 60)

    });


});