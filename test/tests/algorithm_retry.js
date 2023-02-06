const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')
const {
    testData1,
    testData2
} = require('../../config/index').batchOnBatch

const {

    deletePod,

} = require('../../utils/kubeCtl')
const {
    getDriverIdByJobId
} = require('../../utils/socketGet')


const {
    getResult,
    getRawGraph,

} = require('../../utils/results')

const {
    getLogByJobId
} = require('../../utils/elasticsearch')

const {
    getPiplineNodes,
    deletePipeline,
    runRaw,
    storePipeline,
    runStored,
    deconstructTestData

} = require('../../utils/pipelineUtils')
const {
    client
} = require('../../utils/kubeCtl')

chai.use(chaiHttp);
describe('TID-115- the maximum retries for execution of failed algorithm exceeded, (git 62 64) ~', () => {
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    it('max_num_of_algo_retries due to kill algorithm  ', async () => {

        //set test data to testData1
        const d = deconstructTestData(testData2)

        //store pipeline evalwait
        await storePipeline(d)

        //run the pipeline evalwait
        const res = await runStored(d)

        await sleep(5000)
        const jobId = res.body.jobId
        console.log("jobid - " + jobId)
        let deletedPod = ""
        let z = 0
        do {

            await delay(2000)
            const nodes = await getPiplineNodes(jobId)

            const podName = nodes[0]
            if (typeof podName !== "undefined" && deletedPod !== podName) {
                z++
                console.log("z=" + z + " killing pod-" + podName)
                const pod = await client.api.v1.namespaces('default').pods(podName).delete();
                deletedPod = podName;
                await delay(20000);
            }
        }
        while (z < 4);

        const result = await getResult(jobId, 200)
        await delay(5000);
        const log = await getLogByJobId(jobId)
        console.log(result.status)
        console.log(result.error)
        expect(result.status).to.equal("failed")
        expect(result.error).to.contain("is in CrashLoopBackOff, attempts:")
    }).timeout(1000 * 60 * 5);
})
describe('algorithm retry Tests (git 602) ~', () => {
    //https://app.zenhub.com/workspaces/hkube-5a1550823895aa68ea903c98/issues/kube-hpc/hkube/602
    describe('pipeline Types ~', () => {

        const rawPipeCrash = (reson, retries) => {
            return {
                name: "rawPipeCrash",
                experimentName: "main",
                nodes: [
                    {
                        nodeName: "one",
                        algorithmName: "eval-alg",
                        input: [
                            "bla"
                        ],
                        retry: {
                            policy: reson,
                            limit: retries
                        },
                        extraData: {
                            code: [
                                "function exit(input) {",
                                "process.exit(1) }"
                            ]
                        },
                        metrics: {
                            "tensorboard": true
                        }
                    }
                ],
                flowInput: {},
                options: {
                    "batchTolerance": 100,
                    "concurrentPipelines": {
                        "amount": 10,
                        "rejectOnFailure": true
                    },
                    "progressVerbosityLevel": "info",
                    "ttl": 3600
                },
                priority: 3
            }

        }

        const rawPipeError = (reson, retries) => {
            return {
                name: "rawPipeError",
                experimentName: "main",
                nodes: [
                    {
                        nodeName: "one",
                        algorithmName: "eval-alg",
                        input: [
                            "bla"
                        ],
                        retry: {
                            policy: reson,
                            limit: retries
                        },
                        extraData: {
                            code: [
                                "function throwErr(input) {",
                                "if(true) {",
                                "throw new Error('ooppps with even input')",
                                "}",
                                "return input[0]",
                                "}"
                            ]
                        },
                        metrics: {
                            "tensorboard": true
                        }
                    }
                ],
                flowInput: {},
                options: {
                    "batchTolerance": 100,
                    "concurrentPipelines": {
                        "amount": 10,
                        "rejectOnFailure": true
                    },
                    "progressVerbosityLevel": "info",
                    "ttl": 3600
                },
                priority: 3
            }

        }

        describe('pipelina crash ~', async () => {


            it('rawPipeCrash no retry', async () => {
                const rawPipe = rawPipeCrash("Never", 3)
                rawPipe.name = "rawPipeCrashNoRetry"
                const res = await runRaw(rawPipe)
                const jobId = res.body.jobId
                const result = await getResult(jobId, 200)
                const graph = await getRawGraph(jobId)
                expect(graph.body.nodes[0].retries).to.be.equal(undefined)
            }).timeout(1000 * 60 * 2)

            it('rawPipeCrash Always retry 4 time', async () => {
                const rawPipe = rawPipeCrash("Always", 4)
                rawPipe.name = "rawPipeCrashAlwaysRetry4"
                const res = await runRaw(rawPipe)
                const jobId = res.body.jobId
                const result = await getResult(jobId, 200)

                //error:"node one is in CrashLoopBackOff, attempts: 4/4"

                const graph = await getRawGraph(jobId)
                const war = graph.body.nodes[0].warnings.filter(obj => obj.includes("attempts:"))
                expect(war.length).to.be.equal(4)
                expect(graph.body.nodes[0].retries).to.be.equal(4)
            }).timeout(1000 * 60 * 10)


            it('rawPipeCrash OnCrash retry 3 time', async () => {
                const rawPipe = rawPipeCrash("OnCrash", 3)
                rawPipe.name = "rawPipeCrashOnCrashRetry3"
                const res = await runRaw(rawPipe)
                const jobId = res.body.jobId
                console.log("jobid--" + jobId)
                const result = await getResult(jobId, 200)
                //error:"node one is in CrashLoopBackOff, attempts: 3/3"
                const graph = await getRawGraph(jobId)
                const war = graph.body.nodes[0].warnings.filter(obj => obj.includes("attempts:"))
                expect(war.length).to.be.equal(3)
                expect(graph.body.nodes[0].retries).to.be.equal(3)
            }).timeout(1000 * 60 * 10)


            it('rawPipeCrash OnError will not  retry 3 time', async () => {
                const rawPipe = rawPipeCrash("OnError", 3)
                rawPipe.name = "rawPipeCrashErrorRetry3"
                const res = await runRaw(rawPipe)
                const jobId = res.body.jobId
                const result = await getResult(jobId, 200)
                //error: algorithm eval-alg has disconnected while in working state, reason: CLOSE_ABNORMAL. status: terminated,exitCode: 1,reason: Error
                const graph = await getRawGraph(jobId)
                expect(graph.body.nodes[0].retries).to.be.equal(undefined)
            }).timeout(1000 * 60 * 10)

        })

        describe('pipeline Error ~', async () => {


            it('rawPipeError no retry', async () => {
                const rawPipe = rawPipeError("Never", 3)
                rawPipe.name = "rawPipeErrorNoRetry"
                const res = await runRaw(rawPipe)
                const jobId = res.body.jobId
                const result = await getResult(jobId, 200)
                expect(result.status).to.be.equal("failed")
                const graph = await getRawGraph(jobId)
                expect(graph.body.nodes[0].retries).to.be.equal(undefined)
            }).timeout(1000 * 60 * 10)

            it('rawPipeError Always retry 4 time', async () => {
                const rawPipe = rawPipeError("Always", 4)
                rawPipe.name = "rawPipeErrorAlwaysRetry4"
                const res = await runRaw(rawPipe)
                const jobId = res.body.jobId
                const result = await getResult(jobId, 200)

                const graph = await getRawGraph(jobId)
                const war = graph.body.nodes[0].warnings.filter(obj => obj.includes("attempts:"))
                expect(war.length).to.be.equal(4)
                expect(graph.body.nodes[0].retries).to.be.equal(4)
            }).timeout(1000 * 60 * 7)

            it('rawPipeError OnError retry 3 time', async () => {
                const rawPipe = rawPipeError("OnError", 3)
                rawPipe.name = "rawPipeErrorRetry3"
                const res = await runRaw(rawPipe)
                const jobId = res.body.jobId
                const result = await getResult(jobId, 200)
                //error:"node one is in CrashLoopBackOff, attempts: 3/3"
                const graph = await getRawGraph(jobId)
                const war = graph.body.nodes[0].warnings.filter(obj => obj.includes("attempts:"))
                expect(war.length).to.be.equal(3)
                expect(graph.body.nodes[0].retries).to.be.equal(3)
            }).timeout(1000 * 60 * 7)


            it('rawPipeError OnCrash will not  retry 3 time', async () => {
                const rawPipe = rawPipeError("OnCrash", 3)
                rawPipe.name = "rawPipeErrorCrashRetry3"
                const res = await runRaw(rawPipe)
                const jobId = res.body.jobId
                const result = await getResult(jobId, 200)
                const graph = await getRawGraph(jobId)
                expect(graph.body.nodes[0].retries).to.be.equal(undefined)
            }).timeout(1000 * 60 * 7)

        })

        describe('pipeline Error and batchTolerance ~', async () => {

            it('rawPipeError one retry batchTolerance =80', async () => {
                const rawPipe = rawPipeError("OnError", 1)
                rawPipe.name = "rawPipeBatchTolerance"
                rawPipe.nodes[0].input = ["#@flowInput.inp"]
                rawPipe.nodes[0].extraData.code = [
                    "function throwErr(input) {",
                    "if(input !=1) {",
                    "throw new Error('ooppps with even input')",
                    "}",
                    "return input[0]",
                    "}"
                ]
                rawPipe.flowInput.inp = [[1], [1], [1], [1], [0], [1]]
                rawPipe.options.batchTolerance = 80
                const res = await runRaw(rawPipe)
                const jobId = res.body.jobId
                const result = await getResult(jobId, 200)
                expect(result.status).to.be.equal("completed")

            }).timeout(1000 * 60 * 2)


            it('rawPipeError no retry batchTolerance =80', async () => {
                const rawPipe = rawPipeError("Never", 1)
                rawPipe.name = "rawPipeBatchToleranceNoRetry"
                rawPipe.nodes[0].input = ["#@flowInput.inp"]
                rawPipe.nodes[0].extraData.code = [
                    "function throwErr(input) {",
                    "if(input !=1) {",
                    "throw new Error('ooppps with even input')",
                    "}",
                    "return input[0]",
                    "}"
                ]
                rawPipe.flowInput.inp = [[1], [1], [1], [1], [0], [1]]
                rawPipe.options.batchTolerance = 80
                const res = await runRaw(rawPipe)
                const jobId = res.body.jobId
                const result = await getResult(jobId, 200)
                expect(result.status).to.be.equal("completed")

            }).timeout(1000 * 60 * 2)


            it('rawPipeCrash one retry batchTolerance =80', async () => {
                const rawPipe = rawPipeCrash("OnCrash", 1)
                rawPipe.name = "rawPipeBatchErrorToleranceNoRetry"
                rawPipe.nodes[0].input = ["#@flowInput.inp"]
                rawPipe.nodes[0].extraData.code = [
                    "function exit(input) {",
                    "if(input !=1){",
                    "process.exit(input)} }"
                ]
                rawPipe.flowInput.inp = [[1], [1], [1], [1], [0], [1]]
                rawPipe.options.batchTolerance = 80
                const res = await runRaw(rawPipe)
                const jobId = res.body.jobId
                const result = await getResult(jobId, 200)
                expect(result.status).to.be.equal("completed")

            }).timeout(1000 * 60 * 2)


            it('rawPipeCrash no retry batchTolerance =80', async () => {
                const rawPipe = rawPipeCrash("Never", 1)
                rawPipe.name = "rawPipeBatchNeverTolerance"
                rawPipe.nodes[0].input = ["#@flowInput.inp"]
                rawPipe.nodes[0].extraData.code = [
                    "function exit(input) {",
                    "if(input !=1){",
                    "process.exit(input)} }"
                ]
                rawPipe.flowInput.inp = [[1], [1], [1], [1], [0], [1]]
                rawPipe.options.batchTolerance = 80
                const res = await runRaw(rawPipe)
                const jobId = res.body.jobId
                const result = await getResult(jobId, 200)
                expect(result.status).to.be.equal("completed")

            }).timeout(1000 * 60 * 2)


            it('TID-111 retry due to pod fail (git 65)', async () => {
                const d = deconstructTestData(testData2)
                await deletePipeline(d)
                //store pipeline evalwait
                await storePipeline(d)
                const pipe = {
                    name: "evalwait",
                    flowInput: {
                        inputs: [
                            [60000, 1], [60000, 2], [60000, 3], [60000, 4], [60000, 5], [60000, 6], [60000, 7], [60000, 8], [60000, 9], [60000, 10],
                            [60000, 11], [60000, 12], [60000, 13], [60000, 14], [60000, 15], [60000, 16], [60000, 17], [60000, 18], [60000, 19], [60000, 20],
                            [60000, 21], [60000, 22], [60000, 23], [60000, 24], [60000, 25], [60000, 26], [60000, 27], [60000, 28], [60000, 29], [60000, 30],
                            [60000, 31], [60000, 32], [60000, 33], [60000, 34], [60000, 35], [60000, 36], [60000, 37], [60000, 38], [60000, 39], [60000, 40],
                            [60000, 41], [60000, 42], [60000, 43], [60000, 44], [60000, 45], [60000, 46], [60000, 47], [60000, 48], [60000, 49], [60000, 50]
                        ]
                    }
                }
                //run the pipeline evalwait
                const res = await runStored(pipe)
                const jobId = res.body.jobId
                const driver = await getDriverIdByJobId(jobId)
                const nodes = await getPiplineNodes(jobId)

                const partNodes = nodes.slice(0, 3)

                const allAlg = partNodes.map(async (element) => { deletePod(element, 'default') })
                await Promise.all(allAlg);

                const result = await getResult(jobId, 200)
                expect(result.status).to.be.equal("completed")

            }).timeout(1000 * 60 * 10)


            it('batch on batch', async () => {
                const d = deconstructTestData(testData1)

                await storePipeline(d)
                await runStored(d)

            }).timeout(1000 * 60 * 2)
        })
    })



});