const chai = require('chai');
const expect = chai.expect;
const should = chai.should();

const chaiHttp = require('chai-http');
const path = require('path');
const config = require(path.join(process.cwd(), 'config/config'));
const {
    getStatusall,
    getResult,
    idGen
} = require(path.join(process.cwd(), 'utils/results'))
const {
    testData1
} = require(path.join(process.cwd(), 'config/index')).buildAlgPipe

const {
    storePipeline,
    deletePipeline,
    execPipeline,
    deleteAlgorithm,
    applyAlgorithm
} = require(path.join(process.cwd(), 'utils/storeDelete'))



const logger = require(path.join(process.cwd(), 'utils/logger'))
chai.use(chaiHttp);




describe('Store algorithm', () => {
    // timeout(1000 * 60 * 5)
    const testalg1 = 'pyeyemat3'
    const testalg2 = "pymultmat3"

    it(`should store the algorithms and run pipeline with them`, async () => {

        //check if pyeyemat algo exist if it is, delete it
        const pipeName = testData1.descriptor.name;
        const delPipe = await deletePipeline(pipeName)

        await deleteAlgorithm(testalg1)
        await deleteAlgorithm(testalg2)

        //apply the first alg
        const code1 = path.join(process.cwd(), 'additionalFiles/eyeMat.tar.gz');
        await applyAlgorithm(code1, testalg1, 'eyeMat.py')

        //apply the second alg

        const code2 = path.join(process.cwd(), 'additionalFiles/multMat.tar.gz');
        await applyAlgorithm(code2, testalg2, 'multMat.py')

        // run the pipeline

        const pipelineData = testData1.descriptor
        pipelineData.nodes[1].algorithmName = testalg1
        pipelineData.nodes[2].algorithmName = testalg2
        const res = await storePipeline(pipelineData)
        // console.log(res)

        expect(res.statusCode).to.equal(201)

        // console.log(res.body)
        const pipeline = await execPipeline(testData1.descriptor.name, testData1.input)

        const result = await getResult(pipeline, 200)
        // expect(result.data).to.eql(testData1.data)
        console.log(result.data)
        expect(result.status).to.eql('completed')
        expect(result).to.not.have.property('error')


        //delete the pipeline
        const name = testData1.descriptor.name;
        const res3 = await deletePipeline(name)
    }).timeout(1000 * 60 * 20)



    // after('delete the stored pipeline', async () => {
    //     const name = testData1.descriptor.name;
    //     const res = await deletePipeline(name)

    //     // logger.info(`deleting pipeline addmult`)
    //     // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
    //     // expect(res.statusCode).to.equal(200)
    // })
})