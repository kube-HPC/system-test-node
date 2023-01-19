const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')
const {
    runRaw,
    deletePipeline,
    storePipeline,
    runStored,
    deconstructTestData,
    runStoredAndWaitForResults,
    resumePipeline,
    pausePipeline,
    stopPipeline,
} = require('../../../utils/pipelineUtils')

const {
    getResult
} = require('../../../utils/results')
const config = require(path.join(process.cwd(), 'config/config'))

const { getProgress,
    getResults } = require('../../../utils/webhook')
const {
    testData5,
} = require(path.join(process.cwd(), 'config/index')).pipelineTest

describe('webhook test (git 48 49 50 )', () => {


    it('TID 112 TBD webhook pipeline completed', async () => {
        const pipe = {
            name: "simple",
            flowInput: {
                files: {
                    link: "link1"
                }
            },
            webhooks: {
                "progress": `${config.webhookUrl}/progress`,
            },
            priority: 4
        }
        const res = await runStoredAndWaitForResults(pipe)
        await delay(3 * 1000)
        const webhookProcess = await getProgress(res)
        const expectedStatus = ["completed", "active", "pending"]

        const webhookStatus = Array.from(new Set(webhookProcess.body.data.map(d => d.status)))
        expect(expectedStatus.every(i => webhookStatus.includes(i))).to.be.true

    }).timeout(1000 * 60 * 10)



    it('webhook pause resume pipeline ', async () => {
        const e = deconstructTestData(testData5)
        await deletePipeline(e)
        await storePipeline(e)

        const pipe = {
            name: e.name,
            flowInput: {
                range: 15,
                inputs: 3000
            },
            webhooks: {
                "progress": `${config.webhookUrl}/progress`,
                "result": `${config.webhookUrl}/results`
            },
        }
        const res = await runStored(pipe)
        const jobId = res.body.jobId
        await delay(8000)

        const pause = await pausePipeline(jobId);
        await delay(3000)

        const resume = await resumePipeline(jobId);
        const result = await getResult(jobId, 200)
        const webhookProcess = await getProgress(jobId)
        const webhookResults = await getResults(jobId)
        const expectedStatus = ["pending", "active", "paused", "resumed", "completed"]
        const webhookStatus = Array.from(new Set(webhookProcess.body.data.map(d => d.status)))
        expect(expectedStatus.every(i => webhookStatus.includes(i))).to.be.true
        expect(webhookResults.body.data[0].status).to.be.equal("completed")
    }).timeout(1000 * 60 * 10);


    it('webhook  stop pipeline ', async () => {
        const e = deconstructTestData(testData5)
        await deletePipeline(e)
        await storePipeline(e)

        const pipe = {
            name: e.name,
            flowInput: {
                range: 10,
                inputs: 3000
            },
            webhooks: {
                "progress": `${config.webhookUrl}/progress`,
                "result": `${config.webhookUrl}/results`
            },
        }
        const res = await runStored(pipe)
        const jobId = res.body.jobId
        await delay(5000)


        const stop = await stopPipeline(jobId);
        await delay(5000)
        const webhookProcess = await getProgress(jobId)
        const webhookResults = await getResults(jobId)

        const expectedStatus = ["pending", "active", "stopped"]
        const webhookStatus = Array.from(new Set(webhookProcess.body.data.map(d => d.status)))
        console.log("webhookStatus =" + webhookStatus)
        expect(expectedStatus.every(i => webhookStatus.includes(i))).to.be.true
        expect(webhookResults.body.data[0].status).to.be.equal("stopped")
    }).timeout(1000 * 60 * 10);


    it('webhook failed pipeline', async () => {
        const rawcrash = {
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
                        policy: "Never",
                        limit: 1
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
            webhooks: {
                "progress": `${config.webhookUrl}/progress`,
                "result": `${config.webhookUrl}/results`
            },
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

        const res = await runRaw(rawcrash)
        const jobId = res.body.jobId
        const result = await getResult(jobId, 200)
        await delay(5000)
        const webhookProcess = await getProgress(jobId)
        const webhookResults = await getResults(jobId)
        const expectedStatus = ["pending", "active", "failed"]
        const webhookStatus = Array.from(new Set(webhookProcess.body.data.map(d => d.status)))
        console.log("webhookStatus =" + webhookStatus)
        expect(expectedStatus.every(i => webhookStatus.includes(i))).to.be.true
        expect(webhookResults.body.data[0].status).to.be.equal("failed")

    }).timeout(1000 * 60 * 10);


})