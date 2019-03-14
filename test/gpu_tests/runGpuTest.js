const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const chaiHttp = require('chai-http');
const config = require('../../config/config');
const { getResult, getPodsRunning } = require('../../utils/results');
const testData1 = require('../../pipelines/gpuPipeline')
const testData2 = require('../../pipelines/gpuPipeline-1')
chai.use(chaiHttp);


describe('store the gpu algorithm', () => {
    before('store pipeline gpu-demo', async () => {
        const pipeline = testData1.descriptor;
        const res1 = await chai.request(config.apiServerUrl)
            .post('/store/pipelines')
            .send(pipeline);
        res1.should.have.status(201);
    })
    before('store pipeline gpu-demo-1', async () => {
        const pipeline2 = testData2.descriptor;
        const res1 = await chai.request(config.apiServerUrl)
            .post('/store/pipelines')
            .send(pipeline2);
        res1.should.have.status(201);
    })

    it('should run the pipeline gpu-demo and after 2 seconds run the gpuDemo-1 pipeline', async () => {
        const name = testData1.descriptor.name
        let body = testData1.input
        body.name = name
        const res = await chai.request(config.apiServerUrl)
            .post('/exec/stored')
            .send(body)
        // console.log (res)
        res.should.have.status(200);
        res.body.should.have.property('jobId');
        const jobId = res.body.jobId;

        setTimeout(async () => {
            const name2 = testData2.descriptor.name
            let body2 = testData2.input
            body2.name = name2
            const res2 = await chai.request(config.apiServerUrl)
                .post('/exec/stored')
                .send(body2)

            res2.should.have.status(200); l
            res2.body.should.have.property('jobId');
            const jobid2 = res2.body.jobid2

            setTimeout(async () => {
                let runningPods = await getPodsRunning(jobid2)
                runningPods.should.not.be.empty()

            }, 5000)
        }, 2000)



        const result = await getResult(jobId, 200);
        if ('error' in result) {
            process.stdout.write(result.error)

        }
        // expect (result.data).to.eql(testData1.data)
        expect(result.status).to.eql('completed')
        expect(result).to.not.have.property('error')


    }).timeout(5000000);

    after('delete stored pipeline gpu-test', async () => {
        const name = testData1.descriptor.name;
        const res1 = await chai.request(config.apiServerUrl)
            .delete(`/store/pipelines/${name}`)
        res1.should.have.status(200);
    })
    after('delete stored pipeline gpu-test-1', async () => {
        const name1 = testData2.descriptor.name;
        const res11 = await chai.request(config.apiServerUrl)
            .delete(`/store/pipelines/${name1}`)
        res11.should.have.status(200);
    })
})