const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const path = require('path');
const config = require(path.join(process.cwd(), 'config/config'));
const chaiHttp = require('chai-http');
const assertArrays = require('chai-arrays');
// const config = require('../../../config/config');
const delay = require('delay');
const {
    getDriverIdByJobId
} = require(path.join(process.cwd(), 'utils/socketGet'))

const {
    client
} = require(path.join(process.cwd(), 'utils/kubtry'))

const {
    getResult,
    runRaw
} = require(path.join(process.cwd(), 'utils/results'))

const tos = require(path.join(process.cwd(), 'utils/results'.toString()))
// const testData2 = require ('../../pipelines/multadd')
chai.use(chaiHttp);

chai.use(assertArrays);

describe('HA tests', () => {


    it('fail the pipeline driver', async () => {
        const pipe = {
            name: "simple",
            flowInput: {
                files: {
                    link: "link1"
                }
            },
            priority: 1
        }

        const res = await chai.request(config.apiServerUrl)
            .post('/exec/stored')
            .send(pipe)

        res.should.have.status(200)

        const jobId = res.body.jobId


        const driver = await getDriverIdByJobId(jobId)

        const podName = driver[0].podName

        await delay(2000)

        const pod = await client.api.v1.namespaces('default').pods(podName).delete()

        const result = await getResult(jobId, 200)



        // console.log(pod.body)


    }).timeout(1000 * 60 * 5)
})