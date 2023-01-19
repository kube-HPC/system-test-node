const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')

const {
    getPodsRunning
} = require('../../../utils/results')
const {
    testData1,
    testData2,
    testData3,
    testData4
} = require(path.join(process.cwd(), 'config/index')).tid_10
const logger = require('../../../utils/logger')

const {
    deletePipeline,
    storePipeline,
    runStored,
    deconstructTestData,
    checkResults
} = require('../../../utils/pipelineUtils')

const {
    getResult
} = require('../../../utils/results')


chai.use(chaiHttp);

describe('define Pipeline', () => {



    describe('TID-10 , Part or all of the inputs of algorithm are taken from the pipeline\'s request (git id -  34,32)', () => {
        // https://app.zenhub.com/workspaces/hkube-5a1550823895aa68ea903c98/issues/kube-hpc/hkube/32
        // https://app.zenhub.com/workspaces/hkube-5a1550823895aa68ea903c98/issues/kube-hpc/hkube/34

        it('should return result 24', async () => {

            //set test data to testData1
            const d = deconstructTestData(testData1)
            await deletePipeline(d)
            //store pipeline
            await storePipeline(d)

            //run the pipeline
            const res = await runStored(d)

            await checkResults(res, 200, 'completed', d, true)

        }).timeout(1000 * 60 * 5);

        it('should return result 18', async () => {

            //set test data to testData2
            const d = deconstructTestData(testData2)
            await deletePipeline(d)

            //store pipeline
            await storePipeline(d)

            //run the pipeline
            const res = await runStored(d)

            checkResults(res, 200, 'completed', d, true)

        }).timeout(1000 * 60 * 5);


        it('should run the pipeline twice', async () => {

            const d = deconstructTestData(testData1)
            await deletePipeline(d)

            await storePipeline(d)


            const resA = await runStored(d)
            await checkResults(resA, 200, 'completed', d, false)



            const resB = await runStored(d)
            const jobId = resB.body.jobId
            // await delay(30 * 1000)

            // let runningPods = await getPodsRunning(jobId)
            // logger.info(`getting running pods on id ${jobId}`)
            // expect(runningPods.body).to.not.be.empty


            await checkResults(resB, 200, 'completed', d, true)


        }).timeout(1000 * 60 * 5);

    })
    describe('TID 11 - Define_the_Pipe_Line_order ', () => {
        it('Define_the_Pipe_Line_order ', async () => {

            //set test data to testData2
            const d = deconstructTestData(testData4)
            await deletePipeline(d)

            //store pipeline
            const a = await storePipeline(d)

            //run the pipeline
            const res = await runStored(d)
            const result = await getResult(res.body.jobId, 200)
            expect(result.data[0].result).to.be.equal(7)
        }).timeout(1000 * 60 * 5);
    })

    describe('TID 12 - determine batch size (git 29,30,31)', () => {

        it('Define_the_Pipeline_hirarchy ', async () => {

            //set test data to testData2
            const d = deconstructTestData(testData3)
            await deletePipeline(d)

            //store pipeline
            const a = await storePipeline(d)

            //run the pipeline
            const res = await runStored(d)
            const result = await getResult(res.body.jobId, 200)

            const expectedResult = [0, 1, 0, 1, 1, 0, 0, 2, 0, 0, 1, 0, 0, 3, 2, 0]

            for (var i = 0; i < expectedResult.length; i++) {
                console.log(i)
                expect(expectedResult[i]).to.be.equal(result.data[i].result)
            }

        }).timeout(1000 * 60 * 5);
    })


})