const chai = require('chai');
const expect = chai.expect;
const path = require('path');
const config = require(path.join(process.cwd(), 'config/config'));
const chaiHttp = require('chai-http');
const assertArrays = require('chai-arrays');
const fs = require('fs');



const delay = require('delay');


const {
    getResult,
    runRaw

} = require(path.join(process.cwd(), 'utils/results'))
const {
    runStoredAndWaitForResults,
    storePipeline,
    runStored,
    deletePipeline
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))

const tos = require(path.join(process.cwd(), 'utils/results'.toString()))
// const testData2 = require ('../../pipelines/multadd')
chai.use(chaiHttp);

chai.use(assertArrays);



describe('all swagger calls test', () => {

    describe('Execution', () => {
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

            const jobId = res.body.jobId

            const result = await getResult(jobId, 200)
            result.status.should.equal('completed')
        }).timeout(1000 * 60 * 2)



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

            const jobId = res.body.jobId

            const result = await getResult(jobId, 200)

        }).timeout(1000 * 60 * 2)


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

            const jobId2 = res2.body.jobId

            const result2 = await getResult(jobId2, 200)



        }).timeout(1000 * 60 * 5)


        it('test the POST exec/stop rest call', async () => {
            const jobId = await runRaw(30000)


            // const jobId = res.body.jobId

            const data = {
                jobId: jobId,
                reason: "from test"
            }

            await delay(3 * 1000)

            const res2 = await chai.request(config.apiServerUrl)
                .post('/exec/stop')
                .send(data)


            res2.should.have.status(200)

        }).timeout(1000 * 30)

        it('test the GET exec/pipelines/{jobId} rest call', async () => {
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

            const jobId2 = res2.body.jobId

            const result2 = await getResult(jobId2, 200)

        }).timeout(1000 * 60 * 2)


        it('test the GET exec/pipeline/list rest call', async () => {


            const ids = []
            for (let i = 0; i < 5; i++) {
                const jobId = await runRaw(30000)

                ids.push(jobId)
                await delay(1000 * 3)
            }



            await delay(2 * 1000)
            const res = await chai.request(config.apiServerUrl)
                .get(`/exec/pipeline/list`)

            res.should.have.status(200)
            expect(res.body).to.have.lengthOf.above(4)

            for (let i = 0; i < ids.length; i++) {
                await getResult(ids[i], 200);
            }


        }).timeout(1000 * 60 * 5)



        it('test the GET exec/status/{jobId} and exec/results/{jobId} rest call', async () => {
            const rawPipe = {
                name: "rawPipe",
                nodes: [{
                    nodeName: "node1",
                    algorithmName: "eval-alg",
                    input: [15000],
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


        it(`test the GET /exec/tree/{jobId} rest call`, async () => {

            await storePipeline('origPipeline')
            await storePipeline('sonPipeline')

            const run = await runStored('pipe1')
            const jobId = run.body.jobId

            const result = await getResult(jobId, 200);

            const res = await chai.request(config.apiServerUrl)
                .get(`/exec/tree/${jobId}`)

            res.should.have.status(200)

            await deletePipeline('pipe1')
            await deletePipeline('pipe2')

        }).timeout(1000 * 60 * 2)

    })

    describe('Pipelines', () => {


        it('test the GET /pipelines/results/raw/{name} rest call', async () => {
            const name = 'rawPipe'

            const res = await chai.request(config.apiServerUrl)
                .get(`/pipelines/results/raw/${name}`)

            res.should.have.status(200)

            const res2 = await chai.request(config.apiServerUrl)
                .get(`/pipelines/results/raw/${name}?limit=5`)

            res2.should.have.status(200)
            expect(res2.body).to.have.lengthOf(5)

        }).timeout(1000 * 60)


        it('test the GET /pipelines/results/stored/{name} rest call', async () => {
            const name = 'simple'

            const res = await chai.request(config.apiServerUrl)
                .get(`/pipelines/results/stored/${name}`)

            res.should.have.status(200)

            const res2 = await chai.request(config.apiServerUrl)
                .get(`/pipelines/results/stored/${name}?limit=5`)

            res2.should.have.status(200)
            expect(res2.body).to.have.lengthOf(5)

        }).timeout(1000 * 60)



        it('test the GET /pipelines/status/raw/{name} rest call', async () => {
            const name = 'rawPipe'

            const res = await chai.request(config.apiServerUrl)
                .get(`/pipelines/status/raw/${name}`)

            res.should.have.status(200)

            const res2 = await chai.request(config.apiServerUrl)
                .get(`/pipelines/status/raw/${name}?limit=5`)

            res2.should.have.status(200)
            expect(res2.body).to.have.lengthOf(5)

        }).timeout(1000 * 60)


        it('test the GET /pipelines/status/stored/{name} rest call', async () => {
            const name = 'simple'

            const res = await chai.request(config.apiServerUrl)
                .get(`/pipelines/status/stored/${name}`)

            res.should.have.status(200)

            const res2 = await chai.request(config.apiServerUrl)
                .get(`/pipelines/status/stored/${name}?limit=5`)

            res2.should.have.status(200)
            expect(res2.body).to.have.lengthOf(5)

        }).timeout(1000 * 60)

    })

    describe('Store Algorithms', () => {

        it('TBD')
    })
    describe('ReadMe file ', () => {

        const readMeFile = {
            FilePath: path.join(process.cwd(), "additionalFiles/attachments/README.md".toString()),
            startWith: "This"
        }
        const readMeSecondFile = {
            FilePath: path.join(process.cwd(), "additionalFiles/attachments/1/README.md".toString()),
            startWith: "put-Readme"
        }
        describe('Pipeline ReadMe', () => {
            const pipelineName = 'simple'

            it('test the POST /readme/pipline', async () => {


                const res = await chai.request(config.apiServerUrl)
                    .post(`/readme/pipelines/${pipelineName}`)
                    .attach("README.md", fs.readFileSync(readMeFile.FilePath), "README.md");

                res.should.have.status(201)

                const readme = await chai.request(config.apiServerUrl)
                    .get(`/readme/pipelines/${pipelineName}`)

                readme.body.readme.startsWith(readMeFile.startWith).should.be.true;


                await chai.request(config.apiServerUrl)
                    .delete(`/readme/pipelines/${pipelineName}`)

            }).timeout(1000 * 60)

            it('test the Get /readme/pipline', async () => {


                const post = await chai.request(config.apiServerUrl)
                    .post(`/readme/pipelines/${pipelineName}`)
                    .attach("README.md", fs.readFileSync(readMeFile.FilePath), "README.md");

                const res = await chai.request(config.apiServerUrl)
                    .get(`/readme/pipelines/${pipelineName}`)
                res.should.have.status(200)

                res.body.readme.startsWith(readMeFile.startWith).should.be.true;

                await chai.request(config.apiServerUrl)
                    .delete(`/readme/pipelines/${pipelineName}`)

            }).timeout(1000 * 60)



            it('test the PUT /readme/pipline', async () => {


                const post = await chai.request(config.apiServerUrl)
                    .post(`/readme/pipelines/${pipelineName}`)
                    .attach("README.md", fs.readFileSync(readMeFile.FilePath), "README.md");


                const res = await chai.request(config.apiServerUrl)
                    .put(`/readme/pipelines/${pipelineName}`)
                    .attach("README.md", fs.readFileSync(readMeSecondFile.FilePath), "README.md");


                res.should.have.status(200)

                const readme = await chai.request(config.apiServerUrl)
                    .get(`/readme/pipelines/${pipelineName}`)

                readme.body.readme.startsWith(readMeSecondFile.startWith).should.be.true;


                await chai.request(config.apiServerUrl)
                    .delete(`/readme/pipelines/${pipelineName}`)

            }).timeout(1000 * 60)



            it('test the Delete /readme/pipline', async () => {

                await chai.request(config.apiServerUrl)
                    .post(`/readme/pipelines/${pipelineName}`)
                    .attach("README.md", fs.readFileSync(readMeFile.FilePath), "README.md");


                const res = await chai.request(config.apiServerUrl)
                    .delete(`/readme/pipelines/${pipelineName}`)
                res.should.have.status(200)

                const readme = await chai.request(config.apiServerUrl)
                    .get(`/readme/pipelines/${pipelineName}`)

                readme.should.have.status(404)


            }).timeout(1000 * 60)

        })

        describe('Algorithim ReadMe', () => {
            const algName = 'yellow-alg'
            it('test the POST /readme/algorithms', async () => {


                const res = await chai.request(config.apiServerUrl)
                    .post(`/readme/algorithms/${algName}`)
                    .attach("README.md", fs.readFileSync(readMeFile.FilePath), "README.md");

                res.should.have.status(201)

                const readme = await chai.request(config.apiServerUrl)
                    .get(`/readme/algorithms/${algName}`)

                readme.body.readme.startsWith(readMeFile.startWith).should.be.true;

                const del = await chai.request(config.apiServerUrl)
                    .delete(`/readme/algorithms/${algName}`)


            }).timeout(1000 * 60)

            it('test the Get /readme/algorithms', async () => {

                const post = await chai.request(config.apiServerUrl)
                    .post(`/readme/algorithms/${algName}`)
                    .attach("README.md", fs.readFileSync(readMeFile.FilePath), "README.md");

                const res = await chai.request(config.apiServerUrl)
                    .get(`/readme/algorithms/${algName}`)
                res.should.have.status(200)

                res.body.readme.startsWith(readMeFile.startWith).should.be.true;

                const del = await chai.request(config.apiServerUrl)
                    .delete(`/readme/algorithms/${algName}`)

            }).timeout(1000 * 60)



            it('test the PUT /readme/algorithms', async () => {

                const post = await chai.request(config.apiServerUrl)
                    .post(`/readme/algorithms/${algName}`)
                    .attach("README.md", fs.readFileSync(readMeFile.FilePath), "README.md");

                const res = await chai.request(config.apiServerUrl)
                    .put(`/readme/algorithms/${algName}`)
                    .attach("README.md", fs.readFileSync(readMeSecondFile.FilePath), "README.md");

                console.log("res result =" + res.status)
                res.should.have.status(201)

                const readme = await chai.request(config.apiServerUrl)
                    .get(`/readme/algorithms/${algName}`)

                readme.body.readme.startsWith(readMeSecondFile.startWith).should.be.true;

                const del = await chai.request(config.apiServerUrl)
                    .delete(`/readme/algorithms/${algName}`)


            }).timeout(1000 * 60)



            it('test the Delete /readme/algorithms', async () => {

                const post = await chai.request(config.apiServerUrl)
                    .post(`/readme/algorithms/${algName}`)
                    .attach("README.md", fs.readFileSync(readMeFile.FilePath), "README.md");

                const res = await chai.request(config.apiServerUrl)
                    .delete(`/readme/algorithms/${algName}`)
                res.should.have.status(200)

                const readme = await chai.request(config.apiServerUrl)
                    .get(`/readme/algorithms/${algName}`)

                readme.should.have.status(404)



            }).timeout(1000 * 60)

        })
    })

    describe('Webhooks', () => {
        const simplePipLine = require(path.join(process.cwd(), 'config/index')).swaggerCalls
        const pipe = simplePipLine.testData1.body



        it('test the Get webhooks/status/{jobId}', async () => {

            const jobId = await runStoredAndWaitForResults(pipe)

            const res = await chai.request(config.apiServerUrl)
                .get(`/webhooks/status/${jobId}`)
            res.should.have.status(200)

        }).timeout(1000 * 60)

        it('test the Get webhooks/results/{jobId}', async () => {

            const jobId = await runStoredAndWaitForResults(pipe)

            const timeout = await delay(1000 * 5);
            const res = await chai.request(config.apiServerUrl)
                .get(`/webhooks/results/${jobId}`)

            res.should.have.status(200)


        }).timeout(1000 * 60)

        it('test the Get webhooks/{jobId}', async () => {
            const jobId = await runStoredAndWaitForResults(pipe)
            const res = await chai.request(config.apiServerUrl)
                .get(`/webhooks/${jobId}`)
            res.should.have.status(200)


        }).timeout(1000 * 60)
    })

    describe('Store Pipelines', () => {

        before('check if the pipeline addmultForTest is stored', async () => {
            const name = 'addmultForTest'
            const res = await chai.request(config.apiServerUrl)
                .get(`/store/pipeline/${name}`)

            if (res.status != 404) {
                await chai.request(config.apiServerUrl)
                    .delete('/store/pipelines/${name')

            }
        })

        it('test the GET /store/pipelines/{name}', async () => {
            const name = 'simple'

            const res = await chai.request(config.apiServerUrl)
                .get(`/store/pipelines/${name}`)

            res.should.have.status(200)

        }).timeout(1000 * 60)

        it('test the POST /store/pipelines', async () => {

            const pipe = {
                name: 'addmultForTest',
                nodes: [{
                        nodeName: 'evaladd',
                        algorithmName: 'eval-alg',
                        input: [
                            '@flowInput.addInput'
                        ],
                        extraData: {
                            code: [
                                '(input,require)=> {',
                                'const result = input[0][0]+input[0][1]',
                                'return result;}'
                            ]
                        }
                    },
                    {
                        nodeName: 'evalmul',
                        algorithmName: 'eval-alg',
                        input: [
                            '@evaladd',
                            '@flowInput.multInput'
                        ],
                        extraData: {
                            code: [
                                '(input,require)=> {',
                                'const result = input[0] * input[1][0]',
                                'return result;}'
                            ]
                        }
                    }
                ]
            }

            const res = await chai.request(config.apiServerUrl)
                .post('/store/pipelines')
                .send(pipe)

            res.should.have.status(201)
        })


        it('should test the DELETE /store/pipelines/{name}', async () => {
            const name = 'addmultForTest'


            const res = await chai.request(config.apiServerUrl)
                .delete(`/store/pipelines/${name}`)

            res.should.have.status(200)

        })

        it('test the GET /store/pipelines', async () => {
            const res = await chai.request(config.apiServerUrl)
                .get('/store/pipelines')

            res.should.have.status(200)
            expect(res.body).to.have.lengthOf.above(1)
        })

    })




})