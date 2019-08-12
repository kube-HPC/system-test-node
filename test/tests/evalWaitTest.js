const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const chaiHttp = require('chai-http');
const config = require('../../config/config');
const {
    getResult
} = require('../../utils/results');
const {
    testData1,
    testData2
} = require('../../config/index').tid_10;
const logger = require('../../utils/logger')
const delay = require('delay')

chai.use(chaiHttp);


describe('long runing test', () => {
    it('run one pipeline', async () => {
        let body = {
            name: "evalwait",
            flowInput: {
                inputs: [
                    [5000, 1],
                    [5000, 2]
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