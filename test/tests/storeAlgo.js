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
    const testalg1 = 'pyEyeMat'
    const testalg2 = "pyMultMat"


    before(`should check if the algorith ${testalg1}, if it does it should delete it`, async () => {
        const res = await chai.request(config.apiServerUrl)
            .get(`/store/algorithms/${testalg1}`)

        if (res.statusCode === 200) {
            console.log(`algorithm ${testalg1} found, deleting it`)
            const del = await chai.request(config.apiServerUrl)
                .delete(`/store/algorithms/${testalg1}`)
            // console.log(del.body)
        } else {
            console.log(`algorithm ${testalg1} not found`)
        }

    })

    before(`should check if the algorith ${testalg2}, if it does it should delete it`, async () => {
        const res = await chai.request(config.apiServerUrl)
            .get(`/store/algorithms/${testalg2}`)

        if (res.statusCode === 200) {
            console.log(`algorithm ${testalg2} found, deleting it`)
            const del = await chai.request(config.apiServerUrl)
                .delete(`/store/algorithms/${testalg2}`)
            // console.log(del.body)
        } else {
            console.log(`algorithm ${testalg2} not found`)
        }

    })

    // it('true', async () => {
    //     expect(true)
    // })


    it(`should store the algorithm ${testalg1}`, async () => {
        const code = path.join(process.cwd(), 'additionalFiles/eyeMat.tar.gz');
        const data = {
            name: testalg1,
            env: 'python',
            // algorithmImage: 'testAlg',
            cpu: 0.5,
            gpu: 0,
            mem: '512Mi',
            entryPoint: 'eyeMat.py',
            minHotWorkers: 0
        }

        const res = await chai.request(config.apiServerUrl)
            .post('/store/algorithms/apply')
            .field('payload', JSON.stringify(data))
            .attach('file', fse.readFileSync(code), 'eyeMat')

        logger.info(JSON.stringify(res.body))
        // console.log(res.body)

        expect(res.statusCode).to.eql(200)
        const buildId = res.body.buildId
        const buildStatus = await getStatusall(buildId, `/builds/status/`, 200, "completed")

        // console.log(buildStatus)

    }).timeout(60 * 1000)

    it(`should store the algorithm ${testalg2}`, async () => {
        const code = path.join(process.cwd(), 'additionalFiles/multMat.tar.gz');
        const data = {
            name: testalg2,
            env: 'python',
            // algorithmImage: 'testAlg',
            cpu: 0.5,
            gpu: 0,
            mem: '512Mi',
            entryPoint: 'multMat.py',
            minHotWorkers: 0
        }

        const res = await chai.request(config.apiServerUrl)
            .post('/store/algorithms/apply')
            .field('payload', JSON.stringify(data))
            .attach('file', fse.readFileSync(code), 'eyeMat')

        logger.info(JSON.stringify(res.body))
        // console.log(res.body)

        expect(res.statusCode).to.eql(200)
        const buildId = res.body.buildId
        const buildStatus = await getStatusall(buildId, `/builds/status/`, 200, "completed")

        // console.log(buildStatus)

    }).timeout(60 * 1000)



    it('should create a pipeline with the algorithms and run it', async () => {
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



    }).timeout(1000 * 60 * 2)



    after('delete the stored pipeline', async () => {
        const name = testData1.descriptor.name;
        const res = await deletePipeline(name)

        // logger.info(`deleting pipeline addmult`)
        // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
        expect(res.statusCode).to.equal(200)
    })




})