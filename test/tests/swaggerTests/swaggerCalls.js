const chai = require('chai');
const expect = chai.expect;
const path = require('path');
const config = require(path.join(process.cwd(), 'config/config'));
const chaiHttp = require('chai-http');
const assertArrays = require('chai-arrays');
const fs = require('fs');
const {
    write_log
} = require(path.join(process.cwd(), 'utils/misc_utils'))



const delay = require('delay');


const {
    getResult,
    runRaw,
    getRawGraph,
    getParsedGraph
} = require(path.join(process.cwd(), 'utils/results'))
const {
    runStoredAndWaitForResults,
    storePipeline,
    runStored,
    deletePipeline,
    resumePipeline,
    pausePipeline,
    getPipelineStatus
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))
const {
    runAlgorithm,
    getAlgorithm,
     deleteAlgorithm,    
    getAlgorithmVersion,
    updateAlgorithmVersion,
    buildAlgoFromImage,
    deleteAlgorithmVersion,
    getAlgorithim} = require(path.join(process.cwd(), 'utils/algorithmUtils'))
const tos = require(path.join(process.cwd(), 'utils/results'.toString()))
// const testData2 = require ('../../pipelines/multadd')
chai.use(chaiHttp);

chai.use(assertArrays);



describe('all swagger calls test', () => {

    describe('Execution', () => {


        it('test the /exec/algorithm ',async ()=>{
            const alg = {name: 'green-alg',
                            input:[1]}
            const res = await runAlgorithm(alg)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200)
             expect(result.data[0].result).to.be.equal(42)
        }).timeout(1000 * 60 * 2)

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

            // write_log(res.body)
            expect(res).to.have.status(200)

            const jobId = res.body.jobId
            await delay(3 * 1000)
            const result = await getResult(jobId, 200)
            //result.status.should.equal('completed')
            expect(result.status).to.be.equal('completed')
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

            expect(res).to.have.status(200)

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

            // write_log(res2)
            // write_log(res2.status)
            expect(res2).to.have.status(200)

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


            expect(res2).to.have.status(200)

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



            expect(res2).to.have.status(200)

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

            expect(res).to.have.status(200)
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

            expect(res2).to.have.status(200)
            const result = await getResult(jobId, 200);


        }).timeout(1000 * 60 * 5)


        it('test the POST exec/pause/{jobId} and exec/resume/{jobId} rest call', async () => {
            const pausePipe = {
                name: "pausePipe",
                nodes: [
                    {
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
                    }
                ],
                flowInput: {
                    inputs:[
                        [15000,1]
                    ]}
            }
            const tt = await storePipeline(pausePipe)

            const res =await runStored("pausePipe")
            const jobId = res.body.jobId

            await delay(1000 * 3)
           
            const pause = await pausePipeline(jobId);
            await delay(2000)
            let pipelineStatus = await getPipelineStatus(jobId)
            expect(pipelineStatus.body.status).to.be.equal("paused")
            const resume = await resumePipeline(jobId);
            expect(resume.status).to.be.equal(200)
            const result = await getResult(jobId,200)


        }).timeout(1000 * 60 * 5)
        it(`test the GET /exec/tree/{jobId} rest call`, async () => {

            const a= await storePipeline('origPipeline')
            const ab= await storePipeline('sonPipeline')

            const run = await runStored('pipe1')
            const jobId = run.body.jobId

            const result = await getResult(jobId, 200);

            const res = await chai.request(config.apiServerUrl)
                .get(`/exec/tree/${jobId}`)

            expect(res).to.have.status(200)

            await deletePipeline('pipe1')
            await deletePipeline('pipe2')

        }).timeout(1000 * 60 * 2)





    })

    describe('graph api',()=>{
        const pipe = {
                name: "simple",
                flowInput: {
                    files: {
                        link: "link1"
                    }
                },
                priority: 4
            }

        it('Get /graph/raw/{jobId} and rest call', async () => {
            
            const res = await chai.request(config.apiServerUrl)
                .post('/exec/stored')
                .send(pipe)

            const jobId = res.body.jobId
            await getResult(jobId, 200);
            //await delay(1000);
            const rawGraph = await getRawGraph(jobId)
            expect(rawGraph.body.edges.length).to.be.equal(2)
            
        
        }).timeout(1000 * 60 * 2)

         it('Get /graph/parsed/{jobId} and rest call', async () => {
            
            const res = await chai.request(config.apiServerUrl)
                .post('/exec/stored')
                .send(pipe)

            const jobId = res.body.jobId
            await getResult(jobId, 200);
            const ParsedGraph = await getParsedGraph(jobId)
            expect(ParsedGraph.body.nodes.length).to.be.equal(3)
        }).timeout(1000 * 60 * 2)
           



    })

    describe('storage', () => {


        it(' GET /storage/infol', async () => {
            

            const res = await chai.request(config.apiServerUrl)
                .get(`/storage/info`)

            expect(res).to.have.status(200)

        }).timeout(1000 * 60)

        it(' GET /storage/prefix/types', async () => {
            

            const res = await chai.request(config.apiServerUrl)
                .get(`/storage/prefix/types`)

            expect(res).to.have.status(200)

        }).timeout(1000 * 60)


        it(' GET keys by path /storage/prefixes/{path}', async () => {
           

            const res = await chai.request(config.apiServerUrl)
                .get(`/storage/prefix/types`)

            const path = res.body[0]

            const res1 = await chai.request(config.apiServerUrl)
                .get(`/storage/prefixes/${path}`)

            expect(res1).to.have.status(200)



        }).timeout(1000 * 60)



        it(' GET keys by path /storage/keys/{path}', async () => {
           

            const res = await chai.request(config.apiServerUrl)
                .get(`/storage/prefix/types`)

            const path = res.body[0]

            const res1 = await chai.request(config.apiServerUrl)
                .get(`/storage/keys/${path}`)

            expect(res1).to.have.status(200)



        }).timeout(1000 * 60)


        xit(' GET storage data /storage/values/{path}', async () => {
            

            const res = await chai.request(config.apiServerUrl)
                .get(`/storage/prefix/types`)

            const path = res.body[0]

            const res1 = await chai.request(config.apiServerUrl)
                .get(`/storage/keys/${path}`)

            const storagePath = res1.body.keys[0].path

            const res2 = await chai.request(config.apiServerUrl)
                .get(`/storage/values/${storagePath}`)
            
            expect(res2).to.have.status(200)



        }).timeout(1000 * 60)


        it(' GET stream data /storage/stream/{path}', async () => {
            

            const res = await chai.request(config.apiServerUrl)
                .get(`/storage/prefix/types`)

            const path = res.body[0]

            const res1 = await chai.request(config.apiServerUrl)
                .get(`/storage/keys/${path}`)

            const storagePath = res1.body.keys[0].path

            const res2 = await chai.request(config.apiServerUrl)
                .get(`/storage/stream/${storagePath}`)
            
            expect(res2).to.have.status(200)



        }).timeout(1000 * 60)



        it(' GET stream data to file /storage/download/{path}', async () => {
           

            const res = await chai.request(config.apiServerUrl)
                .get(`/storage/prefix/types`)

            const path = res.body[0]

            const res1 = await chai.request(config.apiServerUrl)
                .get(`/storage/keys/${path}`)

            const storagePath = res1.body.keys[0].path

            const res2 = await chai.request(config.apiServerUrl)
                .get(`/storage/download/${storagePath}`)
            
            expect(res2).to.have.status(200)



        }).timeout(1000 * 60)
        

    })
    describe('Pipelines', () => {


        it('test the GET /pipelines/results?{name} rest call', async () => {
            const name = 'rawPipe'

            const res = await chai.request(config.apiServerUrl)
                .get(`/pipelines/results?name=${name}`)

            expect(res).to.have.status(200)

            const res2 = await chai.request(config.apiServerUrl)
                .get(`/pipelines/results?name=${name}&limit=5`)

            expect(res2).to.have.status(200)
            expect(res2.body).to.have.lengthOf(5)

        }).timeout(1000 * 60)


        it('test the GET /pipelines/status/{name} rest call', async () => {
            const name = 'simple'

            const res = await chai.request(config.apiServerUrl)
                .get(`/pipelines/status?name=${name}`)

            expect(res).to.have.status(200)

            const res2 = await chai.request(config.apiServerUrl)
                .get(`/pipelines/status?name=${name}&limit=5`)

            expect(res2).to.have.status(200)
            expect(res2.body).to.have.lengthOf(5)

        }).timeout(1000 * 60)



        it.skip('test the GET /pipelines/status/raw/{name} rest call', async () => {
            const name = 'rawPipe'

            const res = await chai.request(config.apiServerUrl)
                .get(`/pipelines/status/raw/${name}`)

            expect(res).to.have.status(200)

            const res2 = await chai.request(config.apiServerUrl)
                .get(`/pipelines/status/raw/${name}?limit=5`)

            expect(res2).to.have.status(200)
            expect(res2.body).to.have.lengthOf(5)

        }).timeout(1000 * 60)


        it.skip('test the GET /pipelines/status/stored/{name} rest call', async () => {
            const name = 'simple'

            const res = await chai.request(config.apiServerUrl)
                .get(`/pipelines/status/stored/${name}`)

            expect(res).to.have.status(200)

            const res2 = await chai.request(config.apiServerUrl)
                .get(`/pipelines/status/stored/${name}?limit=5`)

            expect(res2).to.have.status(200)
            expect(res2.body).to.have.lengthOf(5)

        }).timeout(1000 * 60)

    })

    describe('Store Algorithms', () => {

        it('TBD')
    })

    describe(' Algorithms version' , () => {
        const algorithmName = "swagrer-algorithm"
        const algorithmImageV1 = "tamir321/algoversion:v1"
        const algorithmImageV2 = "tamir321/algoversion:v2"
        const algJson = (algName,imageName) =>{ 
        let alg = {
            name: algName,
            cpu: 1,
            gpu: 0,
            mem: "256Mi",
            minHotWorkers: 0,
            algorithmImage: imageName,
            type: "Image",
            options: {
                debug: false,
                pending: false
                }       
            }
            return alg
        }   
        
    const algorithmV1 = algJson(algorithmName,algorithmImageV1)
    const algorithmV2 = algJson(algorithmName,algorithmImageV2)  
    it('Get   /versions/algorithms/{name}', async () => {
        await  deleteAlgorithm(algorithmName,true)
         await buildAlgoFromImage(algorithmV1);
         const algVersion = await getAlgorithmVersion(algorithmName);
         expect(algVersion.body.length).to.be.equal(1)
         await buildAlgoFromImage(algorithmV2);
        //validate there are two images
        const algVersion2 = await getAlgorithmVersion(algorithmName);
        
        expect(algVersion2.body.length).to.be.equal(2)
        await  deleteAlgorithm(algorithmName,true)
       
    }).timeout(1000 * 60 * 5);

    it('Delete /versions/algorithms/{name}', async () => {
        await  deleteAlgorithm(algorithmName,true)
         await buildAlgoFromImage(algorithmV1);         
         await buildAlgoFromImage(algorithmV2);
        //validate there are two images
        
        let algVersion = await getAlgorithmVersion(algorithmName);
        expect(algVersion.body.length).to.be.equal(2)
        const del = await deleteAlgorithmVersion(algorithmName,algorithmImageV2)
        await delay(2000)
        algVersion = await getAlgorithmVersion(algorithmName);
        expect(algVersion.body.length).to.be.equal(1)
        await  deleteAlgorithm(algorithmName,true)
       
    }).timeout(1000 * 60 * 5);


    it('Post Apply algorithm version', async () => {
        await  deleteAlgorithm(algorithmName,true)
         await buildAlgoFromImage(algorithmV1);         
         await buildAlgoFromImage(algorithmV2);
         let alg= await getAlgorithm(algorithmName)
         expect(alg.body.algorithmImage).to.be.equal("tamir321/algoversion:v1")
        
        await updateAlgorithmVersion(algorithmName,algorithmImageV2,true)
        alg= await getAlgorithm(algorithmName)
        
        expect(alg.body.algorithmImage).to.be.equal("tamir321/algoversion:v2")
        await  deleteAlgorithm(algorithmName,true)
    }).timeout(1000 * 60 * 5);
   
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

                expect(res).to.have.status(201)

                const readme = await chai.request(config.apiServerUrl)
                    .get(`/readme/pipelines/${pipelineName}`)

               // readme.body.readme.startsWith(readMeFile.startWith).should.be.true;
                const text = readme.body.readme.startsWith(readMeFile.startWith)               
                expect(text).to.be.true

                await chai.request(config.apiServerUrl)
                    .delete(`/readme/pipelines/${pipelineName}`)

            }).timeout(1000 * 60)

            it('test the Get /readme/pipline', async () => {


                const post = await chai.request(config.apiServerUrl)
                    .post(`/readme/pipelines/${pipelineName}`)
                    .attach("README.md", fs.readFileSync(readMeFile.FilePath), "README.md");
                const timeout = await delay(1000 * 3);
                const res = await chai.request(config.apiServerUrl)
                    .get(`/readme/pipelines/${pipelineName}`)
                expect(res).to.have.status(200)

                //res.body.readme.startsWith(readMeFile.startWith).should.be.true;

                const text = res.body.readme.startsWith(readMeFile.startWith)               
                expect(text).to.be.true

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


                expect(res).to.have.status(200)
                const timeout = await delay(1000 * 3);
                const readme = await chai.request(config.apiServerUrl)
                    .get(`/readme/pipelines/${pipelineName}`)

                //readme.body.readme.startsWith(readMeSecondFile.startWith).should.be.true;
                const text = readme.body.readme.startsWith(readMeSecondFile.startWith)               
                expect(text).to.be.true

                await chai.request(config.apiServerUrl)
                    .delete(`/readme/pipelines/${pipelineName}`)

            }).timeout(1000 * 60)



            it('test the Delete /readme/pipline', async () => {

                await chai.request(config.apiServerUrl)
                    .post(`/readme/pipelines/${pipelineName}`)
                    .attach("README.md", fs.readFileSync(readMeFile.FilePath), "README.md");


                const res = await chai.request(config.apiServerUrl)
                    .delete(`/readme/pipelines/${pipelineName}`)
                expect(res).to.have.status(200)

                const readme = await chai.request(config.apiServerUrl)
                    .get(`/readme/pipelines/${pipelineName}`)

                expect(readme).to.have.status(404)


            }).timeout(1000 * 60)

        })

        describe('Algorithim ReadMe', () => {
            const algName = 'yellow-alg'
            it('test the POST /readme/algorithms', async () => {


                const res = await chai.request(config.apiServerUrl)
                    .post(`/readme/algorithms/${algName}`)
                    .attach("README.md", fs.readFileSync(readMeFile.FilePath), "README.md");
               
                expect(res).to.have.status(201)
                const timeout = await delay(1000 * 3);
                const readme = await chai.request(config.apiServerUrl)
                    .get(`/readme/algorithms/${algName}`)

                //readme.body.readme.startsWith(readMeFile.startWith).should.be.true;
                const text = readme.body.readme.startsWith(readMeFile.startWith)               
                expect(text).to.be.true

                const del = await chai.request(config.apiServerUrl)
                    .delete(`/readme/algorithms/${algName}`)


            }).timeout(1000 * 60)

            it('test the Get /readme/algorithms', async () => {

                const post = await chai.request(config.apiServerUrl)
                    .post(`/readme/algorithms/${algName}`)
                    .attach("README.md", fs.readFileSync(readMeFile.FilePath), "README.md");
                const timeout = await delay(1000 * 2);
                const res = await chai.request(config.apiServerUrl)
                            .get(`/readme/algorithms/${algName}`)
                
                expect(res).to.have.status(200)

                const text = res.body.readme.startsWith(readMeFile.startWith)               
                expect(text).to.be.true
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

                write_log("res result =" + res.status)
                expect(res).to.have.status(201)
                const timeout = await delay(1000 * 2);
                const readme = await chai.request(config.apiServerUrl)
                    .get(`/readme/algorithms/${algName}`)

                const text = readme.body.readme.startsWith(readMeSecondFile.startWith)               
                expect(text).to.be.true
                //readme.body.readme.startsWith(readMeSecondFile.startWith).should.be.true;

                const del = await chai.request(config.apiServerUrl)
                    .delete(`/readme/algorithms/${algName}`)


            }).timeout(1000 * 60)



            it('test the Delete /readme/algorithms', async () => {

                const post = await chai.request(config.apiServerUrl)
                    .post(`/readme/algorithms/${algName}`)
                    .attach("README.md", fs.readFileSync(readMeFile.FilePath), "README.md");

                const res = await chai.request(config.apiServerUrl)
                    .delete(`/readme/algorithms/${algName}`)
                expect(res).to.have.status(200)

                const readme = await chai.request(config.apiServerUrl)
                    .get(`/readme/algorithms/${algName}`)

                expect(readme).to.have.status(404)



            }).timeout(1000 * 60)

        })
    })

    describe('Webhooks', () => {
        const simplePipLine = require(path.join(process.cwd(), 'config/index')).swaggerCalls
        const pipe = simplePipLine.testData1.body



        it('test the Get webhooks/status/{jobId}', async () => {

            const jobId = await runStoredAndWaitForResults(pipe)
            const timeout = await delay(1000 * 10);
            const res = await chai.request(config.apiServerUrl)
                .get(`/webhooks/status/${jobId}`)
            expect(res).to.have.status(200)

        }).timeout(1000 * 60)

        it('test the Get webhooks/results/{jobId}', async () => {

            const jobId = await runStoredAndWaitForResults(pipe)

            const timeout = await delay(1000 * 10);
            const res = await chai.request(config.apiServerUrl)
                .get(`/webhooks/results/${jobId}`)

            expect(res).to.have.status(200)


        }).timeout(1000 * 60)

        it('test the Get webhooks/list/{jobId}', async () => {
            const jobId = await runStoredAndWaitForResults(pipe)
            const timeout = await delay(1000 * 10);
            const res = await chai.request(config.apiServerUrl)
                .get(`/webhooks/list/${jobId}`)
            expect(res).to.have.status(200)


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

                expect(res).to.have.status(200)

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

                expect(res).to.have.status(201)
        })


        it('should test the DELETE /store/pipelines/{name}', async () => {
            const name = 'addmultForTest'


            const res = await chai.request(config.apiServerUrl)
                .delete(`/store/pipelines/${name}`)

                expect(res).to.have.status(200)

        })

        it('test the GET /store/pipelines', async () => {
            const res = await chai.request(config.apiServerUrl)
                .get('/store/pipelines')

            expect(res).to.have.status(200)
            expect(res.body).to.have.lengthOf.above(1)
        })

    })




})
