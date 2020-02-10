const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')
const {
    testData1,
} = require(path.join(process.cwd(), 'config/index')).batchOnBatch

const {
    getResult,
    getRawGraph,
    getParsedGraph
  } = require(path.join(process.cwd(), 'utils/results'))

// const KubernetesClient = require('@hkube/kubernetes-client').Client;
const {
    getExecPipeline,
    runRaw,
    getPipeline,
    getPipelineStatus,
    storePipeline,
    runStored,
    deconstructTestData,
    runStoredAndWaitForResults,
    resumePipeline,
    pausePipeline,
    stopPipeline,
    exceCachPipeline
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))


chai.use(chaiHttp);

describe('algorithm retry Tests', () => {

    describe('pipeline Types', () => {

        const rawPipeCrash = (reson,retries)=> {
            return {
                name: "rawPipeCrash",

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
                    "concurrentPipelines": 10,
                    "progressVerbosityLevel": "info",
                    "ttl": 3600
                },
                priority: 3
            }
            
        }

        const rawPipeError = (reson,retries)=> {
            return {
                name: "rawPipeError",

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
                    "concurrentPipelines": 10,
                    "progressVerbosityLevel": "info",
                    "ttl": 3600
                },
                priority: 3
            }
            
        }

    describe( 'pipelina crash ', async ()=>{

       
        it('rawPipeCrash no retry', async () => {
            const rawPipe = rawPipeCrash("Never",3)
            const res = await runRaw(rawPipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200)
            const graph = await getRawGraph(jobId)
            expect(graph.body.nodes[0].retries).to.be.equal(undefined)
        }).timeout(1000 * 60 * 2)

        it('rawPipeCrash Always retry 4 time', async () => {
            const rawPipe = rawPipeCrash("Always",4)
            const res = await runRaw(rawPipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200)

            //error:"node one is in CrashLoopBackOff, attempts: 4/4"

            const graph = await getRawGraph(jobId)
            const war = graph.body.nodes[0].warnings.filter(obj => obj.includes("attempts:"))
            expect(war.length).to.be.equal(4)
            expect(graph.body.nodes[0].retries).to.be.equal(4)
        }).timeout(1000 * 60 * 10)

        it('rawPipeCrash OnCrash retry 3 time', async () => {
            const rawPipe = rawPipeCrash("OnCrash",3)
            const res = await runRaw(rawPipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200)
            //error:"node one is in CrashLoopBackOff, attempts: 3/3"
            const graph = await getRawGraph(jobId)
            const war = graph.body.nodes[0].warnings.filter(obj => obj.includes("attempts:"))
            expect(war.length).to.be.equal(3)
            expect(graph.body.nodes[0].retries).to.be.equal(3)
        }).timeout(1000 * 60 * 10)


        it('rawPipeCrash OnError will not  retry 3 time', async () => {
            const rawPipe = rawPipeCrash("OnError",3)
            const res = await runRaw(rawPipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200)
            //error: algorithm eval-alg has disconnected while in working state, reason: CLOSE_ABNORMAL. status: terminated,exitCode: 1,reason: Error
            const graph = await getRawGraph(jobId)
            expect(graph.body.nodes[0].retries).to.be.equal(undefined)
        }).timeout(1000 * 60 * 10)

    })

    describe( 'pipeline Error ', async ()=>{

       
        it('rawPipeError no retry', async () => {
            const rawPipe = rawPipeError("Never",3)
            const res = await runRaw(rawPipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200)
            expect(result.status).to.be.equal("failed")
            const graph = await getRawGraph(jobId)
            expect(graph.body.nodes[0].retries).to.be.equal(undefined)
        }).timeout(1000 * 60 * 10)

        it('rawPipeError Always retry 4 time', async () => {
            const rawPipe = rawPipeError("Always",4)
            const res = await runRaw(rawPipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200)

            const graph = await getRawGraph(jobId)
            const war = graph.body.nodes[0].warnings.filter(obj => obj.includes("attempts:"))
            expect(war.length).to.be.equal(4)
            expect(graph.body.nodes[0].retries).to.be.equal(4)
        }).timeout(1000 * 60 * 7)

        it('rawPipeError OnError retry 3 time', async () => {
            const rawPipe = rawPipeError("OnError",3)
            const res = await runRaw(rawPipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200)
            //error:"node one is in CrashLoopBackOff, attempts: 3/3"
            const graph = await getRawGraph(jobId)
            const war = graph.body.nodes[0].warnings.filter(obj => obj.includes("attempts:"))
            expect(war.length).to.be.equal(3)
            expect(graph.body.nodes[0].retries).to.be.equal(3)
        }).timeout(1000 * 60 * 7)


        it('rawPipeError OnCrash will not  retry 3 time', async () => {
            const rawPipe = rawPipeError("OnCrash",3)
            const res = await runRaw(rawPipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200)
            const graph = await getRawGraph(jobId)
            expect(graph.body.nodes[0].retries).to.be.equal(undefined)
        }).timeout(1000 * 60 * 7)

    })

    describe( 'pipeline Error and batchTolerance ', async ()=>{
        
        it('rawPipeError one retry batchTolerance =80', async () => {
            const rawPipe = rawPipeError("OnError",1)
            rawPipe.nodes[0].input=["#@flowInput.inp"]
            rawPipe.nodes[0].extraData.code = [
                "function throwErr(input) {",
                "if(input !=1) {",
                "throw new Error('ooppps with even input')",
                "}",
                "return input[0]",
                "}"
            ]
            rawPipe.flowInput.inp=[[1],[1],[1],[1],[0],[1]]
            rawPipe.options.batchTolerance=80
            const res = await runRaw(rawPipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200)
            expect(result.status).to.be.equal("completed")
        
        }).timeout(1000 * 60 * 2)


        it('rawPipeError no retry batchTolerance =80', async () => {
            const rawPipe = rawPipeError("Never",1)
            rawPipe.nodes[0].input=["#@flowInput.inp"]
            rawPipe.nodes[0].extraData.code = [
                "function throwErr(input) {",
                "if(input !=1) {",
                "throw new Error('ooppps with even input')",
                "}",
                "return input[0]",
                "}"
            ]
            rawPipe.flowInput.inp=[[1],[1],[1],[1],[0],[1]]
            rawPipe.options.batchTolerance=80
            const res = await runRaw(rawPipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200)
            expect(result.status).to.be.equal("completed")
        
        }).timeout(1000 * 60 * 2)


        it('rawPipeCrash one retry batchTolerance =80', async () => {
            const rawPipe = rawPipeCrash("OnCrash",1)
            rawPipe.nodes[0].input=["#@flowInput.inp"]
            rawPipe.nodes[0].extraData.code = [
                "function exit(input) {",
                "if(input !=1){",
                "process.exit(input)} }"
            ]
            rawPipe.flowInput.inp=[[1],[1],[1],[1],[0],[1]]
            rawPipe.options.batchTolerance=80
            const res = await runRaw(rawPipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200)
            expect(result.status).to.be.equal("completed")
        
        }).timeout(1000 * 60 * 2)


        it('rawPipeCrash no retry batchTolerance =80', async () => {
            const rawPipe = rawPipeCrash("Never",1)
            rawPipe.nodes[0].input=["#@flowInput.inp"]
            rawPipe.nodes[0].extraData.code = [
                "function exit(input) {",
                "if(input !=1){",
                "process.exit(input)} }"
            ]
            rawPipe.flowInput.inp=[[1],[1],[1],[1],[0],[1]]
            rawPipe.options.batchTolerance=80
            const res = await runRaw(rawPipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200)
            expect(result.status).to.be.equal("completed")
        
        }).timeout(1000 * 60 * 2)



        it('batch on batch', async ()=>{
            const d = deconstructTestData(testData1)
            await storePipeline(d)
            await runStored(d)

        })
    })
    } )
    
   

});