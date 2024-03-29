const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path');
const {
    getResult
} = require('../../../utils/results')
const {
    testData1
} = require(path.join(process.cwd(), 'config/index')).buildAlgPipe

const {
    deconstructTestData,
    runStored,
    storePipeline,
    deletePipeline
} = require('../../../utils/pipelineUtils')

const {
    buildAlgorithmAndWait,
    deleteAlgorithm
} = require('../../../utils/algorithmUtils')
const logger = require('../../../utils/logger')
chai.use(chaiHttp);
const {
    write_log
} = require('../../../utils/misc_utils')


describe('Store algorithm', () => {
    const testalg1 = 'pyeyemat'
    const testalg2 = "pymultmat"

    it(`should store the algorithms and run pipeline with them`, async () => {

        //check if pyeyemat algo exist if it is, delete it
        const d = deconstructTestData(testData1)
        await deletePipeline(d)

        await deleteAlgorithm(testalg1)
        await deleteAlgorithm(testalg2)

        // apply the first alg
        const code1 = path.join(process.cwd(), 'additionalFiles/eyeMat.tar.gz');
        await buildAlgorithmAndWait(code1, testalg1, 'eyeMat.py')

        //apply the second alg

        const code2 = path.join(process.cwd(), 'additionalFiles/multMat.tar.gz');
        await buildAlgorithmAndWait(code2, testalg2, 'multMat.py')

        // run the pipeline

        const pipelineData = testData1.descriptor
        pipelineData.nodes[1].algorithmName = testalg1
        pipelineData.nodes[2].algorithmName = testalg2
        const res = await storePipeline(pipelineData)

        expect(res.statusCode).to.equal(201)
        const pipeline = await runStored(d)


        const result = await getResult(pipeline, 200)
        // expect(result.data).to.eql(testData1.data)
        write_log(result.data)
        expect(result.status).to.eql('completed')
        expect(result).to.not.have.property('error')


        //delete the pipeline
        const name = testData1.descriptor.name;
        const res3 = await deletePipeline(name)
    }).timeout(1000 * 60 * 20)

})