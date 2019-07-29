const chai = require('chai');
const expect = chai.expect;
const should = chai.should();

const chaiHttp = require('chai-http');
const path = require('path');
const config = require('../../config/config');
const {
    getStatusall,
    getResult
} = require('../../utils/results');
const {
    testData1
} = require('../../config/index').buildAlgPipe;

const {
    storePipeline,
    deletePipeline,
    execPipeline
} = require('../../utils/storeDelete')


const fse = require('fs-extra')

const logger = require('../../utils/logger')
chai.use(chaiHttp);




describe('Store algorithm', () => {
    const testalg1 = 'pyeyemat'
    const testalg2 = "pymultmat"

    it(`should store the algorithms and run pipeline with them`, async () => {

        //check if pyeyemat algo exist if it is, delete it
        const pipeName = testData1.descriptor.name;
        const delPipe = await deletePipeline(pipeName)

        await storeAlg(testalg1)
        await storeAlg(testalg2)

        //apply the first alg
        const code1 = path.join(process.cwd(), 'additionalFiles/eyeMat.tar.gz');
        await applyAlg(code1, testalg1, 'eyeMat.py')

        //apply the second alg
        const code2 = path.join(process.cwd(), 'additionalFiles/multMat.tar.gz');
        await applyAlg(code2, testalg2, 'multMat.py')

        //run the pipeline

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
    }).timeout(1000 * 60 * 10)



    // after('delete the stored pipeline', async () => {
    //     const name = testData1.descriptor.name;
    //     const res = await deletePipeline(name)

    //     // logger.info(`deleting pipeline addmult`)
    //     // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
    //     // expect(res.statusCode).to.equal(200)
    // })
})





async function storeAlg(algName) {
    const res = await chai.request(config.apiServerUrl)
        .get(`/store/algorithms/${algName}`)

    if (res.statusCode === 200) {
        console.log(`algorithm ${algName} found, deleting it`)
        const del = await chai.request(config.apiServerUrl)
            .delete(`/store/algorithms/${algName}`)
        console.log(del.body)
    } else {
        console.log(`algorithm ${algName} not found`)
    }

    return
}

async function applyAlg(code, algName, entry) {
    const data = {
        name: algName,
        env: 'python',
        cpu: 0.5,
        gpu: 0,
        mem: '512Mi',
        entryPoint: entry,
        minHotWorkers: 0
    }

    const res = await chai.request(config.apiServerUrl)
        .post('/store/algorithms/apply')
        .field('payload', JSON.stringify(data))
        .attach('file', fse.readFileSync(code), entry)

    logger.info(JSON.stringify(res.body))

    res.should.have.status(200)
    const buildIdAlg = res.body.buildId
    const buildStatusAlg = await getStatusall(buildIdAlg, `/builds/status/`, 200, "completed", 1000 * 60 * 10)

    return buildStatusAlg
}