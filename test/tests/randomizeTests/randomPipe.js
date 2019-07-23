const chai = require('chai')
const expect = chai.expect;
const should = chai.should();

const path = require('path')
const config = require(path.join(process.cwd(), 'config/config'));
const chaiHttp = require('chai-http')
const delay = require('delay')
const {
    getResult,
    runRaw
} = require(path.join(process.cwd(), 'utils/results'))

const {
    randomize
} = require(path.join(process.cwd(), 'utils/createPipeline'))

chai.use(chaiHttp);

// chai.use(assertArrays);

describe('randomize tests', () => {
    it('randomize a pipeline and get its result', async () => {

        const randPipe = randomize(10)
        const res = await chai.request(config.apiServerUrl)
            .post('/exec/raw')
            .send(randPipe)

        console.log(JSON.stringify(randPipe, null, 4))

        res.should.have.status(200)
        const jobId = res.body.jobId
        const result = await getResult(jobId, 200)

        console.log(result)


    }).timeout(1000 * 60 * 2)
})