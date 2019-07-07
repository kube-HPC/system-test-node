const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const path = require('path');
const chaiHttp = require('chai-http');
const assertArrays = require('chai-arrays');
// const config = require('../../../config/config');
const config = require(path.join(process.cwd(), 'config/config'));
const delay = require('delay');

const {
    getResult
} = require(path.join(process.cwd(), 'utils/results'))
// const testData2 = require ('../../pipelines/multadd')
chai.use(chaiHttp);

chai.use(assertArrays);



describe('all swagger calls test', () => {

    //TODO: add negative tests
    it('test the POST exec/raw rest call', async () => {
        const rawPipe = {
            name: "rawPipe",
            nodes: [{
                    nodeName: "node1",
                    algorithmName: "green-alg",
                    input: [1, 2, 3]
                },
                {
                    nodeName: "node2",
                    algorithmName: "yellow-alg",
                    input: ["@node1"]
                }
            ]
        }

        const res = await chai.request(config.apiServerUrl)
            .post('/exec/raw')
            .send(rawPipe)

        // console.log(res.body)
        res.should.have.status(200)

    })


    it('test the POST exec/stored rest call', async () => {
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
    })


    it('test the POST exec/chaching rest call', async () => {

        //run a pipeline to start chaching from it
        const pipe = {
            name: "simple",
            flowInput: {
                files: {
                    link: "link1"
                }
            },
            priority: 4
        }

        const res = await chai.request(config.apiServerUrl)
            .post('/exec/stored')
            .send(pipe)

        const jobId = res.body.jobId


        const result = await getResult(jobId, 200);

        const data = {
            jobId: jobId,
            nodeName: "yellow"
        }

        const res2 = await chai.request(config.apiServerUrl)
            .post('/exec/caching')
            .send(data)

        // console.log(res2)
        // console.log(res2.status)
        res2.should.have.status(200)


    }).timeout(1000 * 60 * 5)


    it('test the POST exec/stop rest call', async () => {
        const pipe = {
            name: "simple",
            flowInput: {
                files: {
                    link: "link1"
                }
            },
            priority: 4
        }

        const res = await chai.request(config.apiServerUrl)
            .post('/exec/stored')
            .send(pipe)

        const jobId = res.body.jobId

        const data = {
            jobId: jobId,
            reason: "from test"
        }
        const res2 = await chai.request(config.apiServerUrl)
            .post('/exec/stop')
            .send(data)


        res2.should.have.status(200)

    })

    it('test the exec/pipelines/{jobId} rest call', async () => {
        const pipe = {
            name: "simple",
            flowInput: {
                files: {
                    link: "link1"
                }
            },
            priority: 4
        }

        const res = await chai.request(config.apiServerUrl)
            .post('/exec/stored')
            .send(pipe)

        const jobId = res.body.jobId


        const res2 = await chai.request(config.apiServerUrl)
            .get(`/exec/pipelines/${jobId}`)

        res2.should.have.status(200)
    })


    it('test the exec/pipeline/list rest call', async () => {
        const pipe = {
            name: "simple",
            flowInput: {
                files: {
                    link: "link1"
                }
            },
            priority: 4
        }

        for (let i = 0; i < 5; i++) {
            let res = await chai.request(config.apiServerUrl)
                .post('/exec/stored')
                .send(pipe)

        }

        const res2 = await chai.request(config.apiServerUrl)
            .get(`/exec/pipeline/list`)

        res2.should.have.status(200)
        expect(res2.body).to.have.lengthOf.above(3)

    }).timeout(1000 * 60 * 2)



    it('test the exec/status/{jobId} rest call', async () => {
        const rawPipe = {
            name: "rawPipe",
            nodes: [{
                nodeName: "node1",
                algorithmName: "eval-alg",
                input: [60000],
                extraData: {
                    code: [
                        "(input)=>{",
                        "return new Promise((resolve,reject)=>{setTimeout(()=>resolve(4),input[0])});}"
                    ]
                }
            }]
        }

        const res = await chai.request(config.apiServerUrl)
            .post('/exec/raw')
            .send(rawPipe)


        const jobId = res.body.jobId

        await delay(1000 * 5)

        const res2 = await chai.request(config.apiServerUrl)
            .get(`/exec/status/${jobId}`)

        res2.should.have.status(200)
        const result = await getResult(jobId, 200);


    }).timeout(1000 * 60 * 5)


})