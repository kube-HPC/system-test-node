const chai = require('chai');

const path = require('path');
const config = require(path.join(process.cwd(), 'config/config'));
const chaiHttp = require('chai-http');
const delay = require('delay');
const {
    getDriverIdByJobId
} = require('../../../utils/socketGet')

const {
    client
} = require('../../../utils/kubeCtl')

const {
    getResult
} = require('../../../utils/results')
const {
    write_log
} = require('../../../utils/misc_utils')

const tos = require('../../../utils/results'.toString())
chai.use(chaiHttp);

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


        const driver = await getDriverIdByJobId(undefined, jobId)

        const podName = driver[0].podName

        await delay(2000)

        const pod = await client.api.v1.namespaces('default').pods(podName).delete()

        const result = await getResult(jobId, 200)



        // write_log(pod.body)


    }).timeout(1000 * 60 * 5)
})