const chai = require('chai');
const expect = chai.expect;
const should = chai.should();

const chaiHttp = require('chai-http');
const path = require('path');
const config = require('../../config/config');
const {
    getStatusall
} = require('../../utils/results');
const {
    testData1
} = require('../../config/index').buildAlgPipe;

const {
    storePipeline,
    deletePipeline
} = require('../../utils/storeDelete')


const fse = require('fs-extra')

const logger = require('../../utils/logger')
chai.use(chaiHttp);


describe('Store algorithm', () => {
    const testalg = 'testalg'


    before('should check if the algorith exist, if it does it should delete it', async () => {
        const res = await chai.request(config.apiServerUrl)
            .get(`/store/algorithms/${testalg}`)

        if (res.statusCode === 200) {
            console.log(`algorithm ${testalg} found, deleting it`)
            const del = await chai.request(config.apiServerUrl)
                .delete(`/store/algorithms/${testalg}`)
            console.log(del.body)
        } else {
            console.log(`algorithm ${testalg} not found`)
        }

    })

    // it('true', async () => {
    //     expect(true)
    // })


    it('should store the algorithm', async () => {
        const code = path.join(process.cwd(), 'additionalFiles/eyeMat.tar.gz');
        const data = {
            name: testalg,
            env: 'python',
            // algorithmImage: 'testAlg',
            cpu: 0.5,
            gpu: 0,
            mem: '512Mi',
            entryPoint: 'main.py',
            minHotWorkers: 0
        }

        const res = await chai.request(config.apiServerUrl)
            .post('/store/algorithms/apply')
            .field('payload', JSON.stringify(data))
            .attach('file', fse.readFileSync(code), 'eyeMat')

        logger.info(JSON.stringify(res.body))
        console.log(res.body)

        expect(res.statusCode).to.eql(200)
        const buildId = res.body.buildId
        const buildStatus = await getStatusall(buildId, `/builds/status/`, 200, "completed")

        console.log(buildStatus)

    }).timeout(60 * 1000)


    it.only('should create a pipeline with the algorith', async () => {
        const pipeline = testData1.descriptor
        const res = await storePipeline(pipeline)
        console.log(res)
        expect(res.statusCode).to.equal(201)
        console.log(res.statusCode)
    })



    after('delete the stored pipeline', async () => {
        const name = testData1.descriptor.name;
        const res1 = await chai.request(config.apiServerUrl)
            .delete(`/store/pipelines/${name}`)

        // logger.info(`deleting pipeline addmult`)
        // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
        expect(res1.statusCode).to.equal(200)
    })


})