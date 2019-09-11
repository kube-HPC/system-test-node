const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const chaiHttp = require('chai-http');
const path = require('path')
require(path.join(process.cwd(), 'config/config'));
const {
    getResult
} = require(path.join(process.cwd(), 'utils/results'));
const {
    testData1,
    testData2
} = require(path.join(process.cwd(), 'config/index')).tid_10;
const logger = require(path.join(process.cwd(), 'utils/logger'));
const delay = require('delay')

const config = require(path.join(process.cwd(), 'config/config'))


chai.use(chaiHttp);

const pipeline = {
    name: "evalwait",
    nodes: [{
        nodeName: "evalsleep",
        algorithmName: "eval-alg",
        input: [
            "#@flowInput.inputs"
        ],
        extraData: {
            code: [
                "(input,require)=> {",
                "return new Promise((resolve,reject)=>{setTimeout(()=>resolve(input[0][1]),input[0][0])});}"
            ]
        }
    }]
}
describe('long runing test', () => {
    it('run one pipeline', async () => {

        const store = await storePipeline(pipeline)


        const max = 15000
        const min = 5000
        const rand1 = Math.floor(Math.random() * (max - min) + min)
        const rand2 = Math.floor(Math.random() * (max - min) + min)
        let body = {
            name: "evalwait",
            flowInput: {
                inputs: [
                    [rand1, 1],
                    [rand2, 2]
                ]
            }
        }
        const res = await chai.request(config.apiServerUrl)
            .post('/exec/stored')
            .send(body)
        // console.log (res)
        if (res.status != 200) {
            logger.error(res.body)
            delay(1000 * 60 * 3)
        }
        res.should.have.status(200);
        res.body.should.have.property('jobId');
        const jobId = res.body.jobId;


        const result = await getResult(jobId, 200);
        if ('error' in result) {
            process.stdout.write(result.error)

        }

        logger.info(`getting results from execution`)
        logger.info(`${res.status} ${JSON.stringify(res.body)}`)

        // expect(result.data).to.eql(testData1.data)
        expect(result.status).to.eql('completed')
        expect(result).to.not.have.property('error')
    }).timeout(1000 * 60 * 10)
})


const storePipeline = async (desciptor) => {
    const res = await chai.request(config.apiServerUrl)
        .post('/store/pipelines')
        .send(desciptor)

    return res
}