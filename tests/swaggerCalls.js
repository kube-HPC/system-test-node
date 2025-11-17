const chai = require('chai');
const expect = chai.expect;
const path = require('path');
const config = require(path.join(process.cwd(), 'config/config'));
const chaiHttp = require('chai-http');
const assertArrays = require('chai-arrays');
const { pipelineStatuses } = require('@hkube/consts');
const fs = require('fs');

const {
    write_log,
    loginWithRetry
} = require('../utils/misc_utils');

const delay = require('delay');

const {
    getResult,
    runRaw,
    getRawGraph,
    getParsedGraph
} = require('../utils/results');

const {
    pipelineRandomName,
    runStoredAndWaitForResults,
    storePipeline,
    runStored,
    deletePipeline,
    resumePipeline,
    pausePipeline,
    getPipelineStatus
} = require('../utils/pipelineUtils');

const {
    runAlgorithm,
    getAlgorithm,
    deleteAlgorithm,
    getAlgorithmVersion,
    updateAlgorithmVersion,
    storeAlgorithmApply,
    deleteAlgorithmVersion,
    buildAlgorithmAndWait
} = require('../utils/algorithmUtils');

// const tos = require('../utils/results'.toString());
// const testData2 = require ('../../pipelines/multadd')
chai.use(chaiHttp);

chai.use(assertArrays);

describe('all swagger calls test ', () => {
    let dev_token;

    before(async function () {
        this.timeout(1000 * 60 * 15);
        dev_token = await loginWithRetry();
    });

    let algList = [];
    let pipeList = [];

    const applyAlg = async (alg, token = {}) => {
        await deleteAlgorithm(alg.name, token, true);
        if (!algList.includes(alg.name)) {
            algList.push(alg.name);
        }
        const res = await storeAlgorithmApply(alg, token);
        return res;
    }

    beforeEach(function () {
        console.log('\n-----------------------------------------------\n');
    });

    after(async function () {
        this.timeout(2 * 60 * 1000);
        console.log("algList = " + algList);
        j = 0;
        z = 3;

        while (j < algList.length) {
            delAlg = algList.slice(j, z);
            const del = delAlg.map((e) => {
                return deleteAlgorithm(e, dev_token);
            });
            console.log("delAlg-", JSON.stringify(delAlg, null, 2));
            const delResult = await Promise.all(del);
            delResult.forEach(result => {
                if (result && result.text) {
                    console.log("Delete Result Message:", result.text);
                }
            });
            await delay(2000);
            j += 3;
            z += 3;
            console.log("j=" + j + ",z=" + z);
        }

        console.log("-----------------------------------------------");
        console.log("pipeList = " + pipeList);
        j = 0;
        z = 3;

        while (j < pipeList.length) {
            delPipe = pipeList.slice(j, z);
            const del = delPipe.map((e) => {
                return deletePipeline(e, dev_token);
            });
            console.log("delPipe-", JSON.stringify(delPipe, null, 2));
            const delResult = await Promise.all(del);
            delResult.forEach(result => {
                if (result && result.text) {
                    console.log("Delete Result Message:", result.text);
                }
            });
            await delay(2000);
            j += 3;
            z += 3;
            console.log("j=" + j + ",z=" + z);
        }
        console.log("----------------------- end -----------------------");
    });

    describe('Execution 647', () => {
        //https://app.zenhub.com/workspaces/hkube-5a1550823895aa68ea903c98/issues/kube-hpc/hkube/647

        it('test the /exec/algorithm ', async () => {
            const alg = {
                name: 'green-alg',
                input: [42]
            }
            const res = await runAlgorithm(alg, dev_token);
            const jobId = res.body.jobId;
            const result = await getResult(jobId, 200, dev_token);
            expect(result.data[0].result).to.be.equal(42);
        }).timeout(1000 * 60 * 2);

        it('test the POST exec/raw rest call', async () => {
            const rawPipe = {
                name: "rawPipe",
                nodes: [
                    {
                        nodeName: "node1",
                        algorithmName: "green-alg",
                        input: [1, 2, 3]
                    },
                    {
                        nodeName: "node2",
                        algorithmName: "yellow-alg",
                        input: ["@node1"]
                    }]
            }

            const res = await chai.request(config.apiServerUrl)
                .post('/exec/raw')
                .set("Authorization", `Bearer ${dev_token}`)
                .send(rawPipe);

            // write_log(res.body)
            expect(res).to.have.status(200);

            const jobId = res.body.jobId;
            await delay(3 * 1000);
            const result = await getResult(jobId, 200, dev_token);
            //result.status.should.equal('completed')
            expect(result.status).to.be.equal('completed');
        }).timeout(1000 * 60 * 2);

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
                .set("Authorization", `Bearer ${dev_token}`)
                .send(pipe);

            expect(res).to.have.status(200);
            const jobId = res.body.jobId;
            await getResult(jobId, 200, dev_token);
        }).timeout(1000 * 60 * 2);

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
                .set("Authorization", `Bearer ${dev_token}`)
                .send(pipe);

            const jobId = res.body.jobId;
            await getResult(jobId, 200, dev_token);

            const data = {
                jobId: jobId,
                nodeName: "yellow"
            }

            const res2 = await chai.request(config.apiServerUrl)
                .post('/exec/caching')
                .set("Authorization", `Bearer ${dev_token}`)
                .send(data);

            // write_log(res2)
            // write_log(res2.status)
            expect(res2).to.have.status(200);
            const jobId2 = res2.body.jobId;
            await getResult(jobId2, 200, dev_token);
        }).timeout(1000 * 60 * 5)

        it('test the POST /exec/stop rest call', async () => {
            const jobId = await runRaw(dev_token, 30000);
            // const jobId = res.body.jobId

            const data = {
                jobId: jobId,
                reason: "from test",
                statusToStop: pipelineStatuses.ACTIVE
            }

            await delay(3 * 1000);
            const res2 = await chai.request(config.apiServerUrl)
                .post('/exec/stop')
                .set("Authorization", `Bearer ${dev_token}`)
                .send(data);

            expect(res2).to.have.status(200);
        }).timeout(1000 * 30);

        it('test the POST /exec/stop rest call with failure due to status', async () => {
            const jobId = await runRaw(dev_token, 30000);
            // const jobId = res.body.jobId

            const data = {
                jobId: jobId,
                reason: "from test",
                statusToStop: pipelineStatuses.PENDING
            }

            await delay(3 * 1000);
            const res2 = await chai.request(config.apiServerUrl)
                .post('/exec/stop')
                .set("Authorization", `Bearer ${dev_token}`)
                .send(data);

            expect(res2).to.have.status(404);
            expect(res2.body.error.message).to.be.equal(`No jobs found matching criteria (jobId: ${data.jobId}, statuses: pending)`);
        }).timeout(1000 * 30);

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
                .set("Authorization", `Bearer ${dev_token}`)
                .send(pipe);

            const jobId = res.body.jobId;
            const res2 = await chai.request(config.apiServerUrl)
                .get(`/exec/pipelines/${jobId}`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res2).to.have.status(200);
            const jobId2 = res2.body.jobId;
            await getResult(jobId2, 200, dev_token);
        }).timeout(1000 * 60 * 2);

        it('test the GET exec/pipeline/list rest call', async () => {
            const ids = []
            for (let i = 0; i < 5; i++) {
                const jobId = await runRaw(dev_token, 30000);
                ids.push(jobId);
                await delay(1000 * 3);
            }
            await delay(2 * 1000);
            const res = await chai.request(config.apiServerUrl)
                .get(`/exec/pipeline/list`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res).to.have.status(200);
            expect(res.body).to.have.lengthOf.above(4);

            for (let i = 0; i < ids.length; i++) {
                await getResult(ids[i], 200, dev_token);
            }
        }).timeout(1000 * 60 * 5);

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
                .set("Authorization", `Bearer ${dev_token}`)
                .send(rawPipe);

            const jobId = res.body.jobId;
            await delay(1000 * 5);

            const res2 = await chai.request(config.apiServerUrl)
                .get(`/exec/status/${jobId}`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res2).to.have.status(200);
            await getResult(jobId, 200, dev_token);
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
                    inputs: [
                        [15000, 1]
                    ]
                }
            }
            await deletePipeline("pausePipe", dev_token);
            await storePipeline(pausePipe, dev_token, pipeList);

            const res = await runStored("pausePipe", dev_token);
            const jobId = res.body.jobId;

            await delay(1000 * 3);

            await pausePipeline(jobId, dev_token);
            await delay(2000);
            let pipelineStatus = await getPipelineStatus(jobId, dev_token);
            expect(pipelineStatus.body.status).to.be.equal("paused");
            await delay(10000);
            const resume = await resumePipeline(jobId, dev_token);
            expect(resume.status).to.be.equal(200);
            await getResult(jobId, 200, dev_token);
        }).timeout(1000 * 60 * 5);

        it(`test the GET /exec/tree/{jobId} rest call`, async () => {
            await deletePipeline('pipe1', dev_token);
            await deletePipeline('pipe2', dev_token);
            await delay(1000);
            const a = await storePipeline('origPipeline', dev_token, pipeList);
            await delay(1000);
            const ab = await storePipeline('sonPipeline', dev_token, pipeList);

            expect(ab).to.have.status(201, "fail to create pipeline");
            const run = await runStored('pipe1', dev_token);
            const jobId = run.body.jobId;

            await getResult(jobId, 200, dev_token);
            await delay(1000);
            const res = await chai.request(config.apiServerUrl)
                .get(`/exec/tree/${jobId}`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res).to.have.status(200);
            await delay(1000);
        }).timeout(1000 * 60 * 2);
    });

    describe('graph api (git 545)', () => {
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
                .set("Authorization", `Bearer ${dev_token}`)
                .send(pipe);

            const jobId = res.body.jobId;
            await getResult(jobId, 200, dev_token);
            //await delay(1000);
            const rawGraph = await getRawGraph(jobId, dev_token);
            expect(rawGraph.body.edges.length).to.be.equal(2);
        }).timeout(1000 * 60 * 2);

        it('Get /graph/parsed/{jobId} and rest call', async () => {
            const res = await chai.request(config.apiServerUrl)
                .post('/exec/stored')
                .set("Authorization", `Bearer ${dev_token}`)
                .send(pipe);

            const jobId = res.body.jobId;
            await getResult(jobId, 200, dev_token);
            const ParsedGraph = await getParsedGraph(jobId, dev_token);
            expect(ParsedGraph.body.nodes.length).to.be.equal(3);
        }).timeout(1000 * 60 * 2);
    });

    describe('storage git(554)', () => {
        it('GET /storage/infol', async () => {
            const res = await chai.request(config.apiServerUrl)
                .get(`/storage/info`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res).to.have.status(200);
        }).timeout(1000 * 60 * 3);

        it('GET /storage/prefix/types', async () => {
            const res = await chai.request(config.apiServerUrl)
                .get(`/storage/prefix/types`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res).to.have.status(200);
        }).timeout(1000 * 60 * 3);

        it('GET keys by path /storage/prefixes/{path}', async () => {
            const res = await chai.request(config.apiServerUrl)
                .get(`/storage/prefix/types`)
                .set("Authorization", `Bearer ${dev_token}`);

            const path = res.body[1];
            const res1 = await chai.request(config.apiServerUrl)
                .get(`/storage/prefixes/${path}`)
                .set("Authorization", `Bearer ${dev_token}`);
            expect(res1).to.have.status(200);
        }).timeout(1000 * 60 * 3);

        it('GET keys by path /storage/keys/{path}', async () => {
            const res = await chai.request(config.apiServerUrl)
                .get(`/storage/prefix/types`)
                .set("Authorization", `Bearer ${dev_token}`);

            const path = res.body[6];
            const res1 = await chai.request(config.apiServerUrl)
                .get(`/storage/keys/${path}`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res1).to.have.status(200);
        }).timeout(1000 * 60 * 3);

        it('GET storage data /storage/values/{path}', async () => {
            const res = await chai.request(config.apiServerUrl)
                .get(`/storage/prefix/types`)
                .set("Authorization", `Bearer ${dev_token}`);

            const path = res.body[6];
            const res1 = await chai.request(config.apiServerUrl)
                .get(`/storage/keys/${path}`)
                .set("Authorization", `Bearer ${dev_token}`);

            const storagePath = res1.body.keys[0].path;
            const res2 = await chai.request(config.apiServerUrl)
                .get(`/storage/values/${storagePath}`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res2).to.have.status(200);
        }).timeout(1000 * 60 * 10);

        it('GET stream data /storage/stream/{path}', async () => {
            const res = await chai.request(config.apiServerUrl)
                .get(`/storage/prefix/types`)
                .set("Authorization", `Bearer ${dev_token}`);

            const path = res.body[6];
            const res1 = await chai.request(config.apiServerUrl)
                .get(`/storage/keys/${path}`)
                .set("Authorization", `Bearer ${dev_token}`);

            const storagePath = res1.body.keys[0].path;
            const res2 = await chai.request(config.apiServerUrl)
                .get(`/storage/stream/${storagePath}`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res2).to.have.status(200);
        }).timeout(1000 * 180);

        it('GET stream data to file /storage/download/{path}', async () => {
            const res = await chai.request(config.apiServerUrl)
                .get(`/storage/prefix/types`)
                .set("Authorization", `Bearer ${dev_token}`);

            const path = res.body[6];
            const res1 = await chai.request(config.apiServerUrl)
                .get(`/storage/keys/${path}`)
                .set("Authorization", `Bearer ${dev_token}`);

            const storagePath = res1.body.keys[0].path;
            const res2 = await chai.request(config.apiServerUrl)
                .get(`/storage/download/${storagePath}`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res2).to.have.status(200);
        }).timeout(1000 * 60 * 3);
    });

    describe('Pipelines', () => {
        it('test the GET /pipelines/results?{name} rest call', async () => {
            const name = 'rawPipe';
            const res = await chai.request(config.apiServerUrl)
                .get(`/pipelines/results?name=${name}`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res).to.have.status(200);
            const res2 = await chai.request(config.apiServerUrl)
                .get(`/pipelines/results?name=${name}&limit=5`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res2).to.have.status(200);
            expect(res2.body).to.have.lengthOf(5);
        }).timeout(1000 * 60 * 3);

        it('test the GET /pipelines/status/{name} rest call', async () => {
            const name = 'simple';
            const res = await chai.request(config.apiServerUrl)
                .get(`/pipelines/status?name=${name}`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res).to.have.status(200);
            const res2 = await chai.request(config.apiServerUrl)
                .get(`/pipelines/status?name=${name}&limit=5`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res2).to.have.status(200);
            expect(res2.body).to.have.lengthOf(5);
        }).timeout(1000 * 60 * 3);

        it.skip('test the GET /pipelines/status/raw/{name} rest call', async () => {
            const name = 'rawPipe';

            const res = await chai.request(config.apiServerUrl)
                .get(`/pipelines/status/raw/${name}`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res).to.have.status(200);
            const res2 = await chai.request(config.apiServerUrl)
                .get(`/pipelines/status/raw/${name}?limit=5`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res2).to.have.status(200);
            expect(res2.body).to.have.lengthOf(5);
        }).timeout(1000 * 60 * 3);

        it.skip('test the GET /pipelines/status/stored/{name} rest call', async () => {
            const name = 'simple';

            const res = await chai.request(config.apiServerUrl)
                .get(`/pipelines/status/stored/${name}`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res).to.have.status(200);
            const res2 = await chai.request(config.apiServerUrl)
                .get(`/pipelines/status/stored/${name}?limit=5`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res2).to.have.status(200);
            expect(res2.body).to.have.lengthOf(5);
        }).timeout(1000 * 60 * 3);
    });

    describe('Store Algorithms', () => {
        it('TBD');
    });

    describe('Algorithms version', () => {
        const algorithmName = "swagrer-algorithm";
        const algorithmImageV1 = "tamir321/algoversion:v1";
        const algorithmImageV2 = "tamir321/algoversion:v2";
        const algJson = (algName, imageName) => {
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
                },
                workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 2000 }
            }
            return alg;
        }

        const algorithmV1 = algJson(algorithmName, algorithmImageV1);
        const algorithmV2 = algJson(algorithmName, algorithmImageV2);
        it('Get /versions/algorithms/{name}', async () => {
            await applyAlg(algorithmV1, dev_token);
            const algVersion = await getAlgorithmVersion(algorithmName, dev_token);
            const versionAmount = algVersion.body.length;
            expect(versionAmount).to.be.greaterThan(0);
            await storeAlgorithmApply(algorithmV2, dev_token);
            //validate there are two images
            const algVersion2 = await getAlgorithmVersion(algorithmName, dev_token);

            expect(algVersion2.body.length).to.be.equal(versionAmount + 1);
        }).timeout(1000 * 60 * 5);

        it('Delete /versions/algorithms/{name}', async () => {
            await applyAlg(algorithmV1, dev_token);
            let v2 = await storeAlgorithmApply(algorithmV2, dev_token);
            //validate there are two images

            let algVersion = await getAlgorithmVersion(algorithmName, dev_token);
            expect(algVersion.body.length).to.be.equal(2)
            await deleteAlgorithmVersion(algorithmName, v2.body.algorithm.version, dev_token)
            await delay(2000)
            algVersion = await getAlgorithmVersion(algorithmName, dev_token);
            expect(algVersion.body.length).to.be.equal(1)
        }).timeout(1000 * 60 * 5);

        it('Post Apply algorithm version', async () => {
            await applyAlg(algorithmV1, dev_token);
            let v2 = await storeAlgorithmApply(algorithmV2, dev_token);
            let alg = await getAlgorithm(algorithmName, dev_token);
            expect(alg.body.algorithmImage).to.be.equal("tamir321/algoversion:v1");

            await updateAlgorithmVersion(algorithmName, v2.body.algorithm.version, dev_token, true);
            alg = await getAlgorithm(algorithmName, dev_token);

            expect(alg.body.algorithmImage).to.be.equal("tamir321/algoversion:v2");
        }).timeout(1000 * 60 * 5);
    });

    describe('ReadMe file', () => {
        const readMeFile = {
            FilePath: path.join(process.cwd(), "additionalFiles/attachments/README.md".toString()),
            startWith: "This"
        }

        const readMeSecondFile = {
            FilePath: path.join(process.cwd(), "additionalFiles/attachments/1/README.md".toString()),
            startWith: "put-Readme"
        }

        describe('Pipeline ReadMe', () => {
            const pipelineName = 'simple';

            it('test the POST /readme/pipline', async () => {
                const res = await chai.request(config.apiServerUrl)
                    .post(`/readme/pipelines/${pipelineName}`)
                    .set("Authorization", `Bearer ${dev_token}`)
                    .attach("README.md", fs.readFileSync(readMeFile.FilePath), "README.md");

                expect(res).to.have.status(201);
                const readme = await chai.request(config.apiServerUrl)
                    .get(`/readme/pipelines/${pipelineName}`)
                    .set("Authorization", `Bearer ${dev_token}`);

                // readme.body.readme.startsWith(readMeFile.startWith).should.be.true;
                const text = readme.body.readme.startsWith(readMeFile.startWith);
                expect(text).to.be.true;
                await chai.request(config.apiServerUrl)
                    .delete(`/readme/pipelines/${pipelineName}`)
                    .set("Authorization", `Bearer ${dev_token}`);
            }).timeout(1000 * 60 * 3);

            it('test the Get /readme/pipline', async () => {
                const post = await chai.request(config.apiServerUrl)
                    .post(`/readme/pipelines/${pipelineName}`)
                    .set("Authorization", `Bearer ${dev_token}`)
                    .attach("README.md", fs.readFileSync(readMeFile.FilePath), "README.md");
                const timeout = await delay(1000 * 3);
                const res = await chai.request(config.apiServerUrl)
                    .get(`/readme/pipelines/${pipelineName}`)
                    .set("Authorization", `Bearer ${dev_token}`);
                expect(res).to.have.status(200);

                //res.body.readme.startsWith(readMeFile.startWith).should.be.true;

                const text = res.body.readme.startsWith(readMeFile.startWith);
                expect(text).to.be.true;
                await chai.request(config.apiServerUrl)
                    .delete(`/readme/pipelines/${pipelineName}`)
                    .set("Authorization", `Bearer ${dev_token}`);
            }).timeout(1000 * 60 * 3);

            it('test the PUT /readme/pipline', async () => {
                const post = await chai.request(config.apiServerUrl)
                    .post(`/readme/pipelines/${pipelineName}`)
                    .set("Authorization", `Bearer ${dev_token}`)
                    .attach("README.md", fs.readFileSync(readMeFile.FilePath), "README.md");

                const res = await chai.request(config.apiServerUrl)
                    .put(`/readme/pipelines/${pipelineName}`)
                    .set("Authorization", `Bearer ${dev_token}`)
                    .attach("README.md", fs.readFileSync(readMeSecondFile.FilePath), "README.md");

                expect(res).to.have.status(200);
                const timeout = await delay(1000 * 3);
                const readme = await chai.request(config.apiServerUrl)
                    .get(`/readme/pipelines/${pipelineName}`)
                    .set("Authorization", `Bearer ${dev_token}`);

                //readme.body.readme.startsWith(readMeSecondFile.startWith).should.be.true;
                const text = readme.body.readme.startsWith(readMeSecondFile.startWith);
                expect(text).to.be.true;
                await chai.request(config.apiServerUrl)
                    .delete(`/readme/pipelines/${pipelineName}`)
                    .set("Authorization", `Bearer ${dev_token}`);
            }).timeout(1000 * 60 * 3);

            it('test the Delete /readme/pipline', async () => {
                await chai.request(config.apiServerUrl)
                    .post(`/readme/pipelines/${pipelineName}`)
                    .set("Authorization", `Bearer ${dev_token}`)
                    .attach("README.md", fs.readFileSync(readMeFile.FilePath), "README.md");

                const res = await chai.request(config.apiServerUrl)
                    .delete(`/readme/pipelines/${pipelineName}`)
                    .set("Authorization", `Bearer ${dev_token}`);
                expect(res).to.have.status(200);

                const readme = await chai.request(config.apiServerUrl)
                    .get(`/readme/pipelines/${pipelineName}`)
                    .set("Authorization", `Bearer ${dev_token}`);

                expect(readme).to.have.status(404);
            }).timeout(1000 * 60 * 3);
        });

        describe('Algorithim ReadMe', () => {
            const algName = 'yellow-alg';
            it('test the POST /readme/algorithms', async () => {
                const res = await chai.request(config.apiServerUrl)
                    .post(`/readme/algorithms/${algName}`)
                    .set("Authorization", `Bearer ${dev_token}`)
                    .attach("README.md", fs.readFileSync(readMeFile.FilePath), "README.md");

                expect(res).to.have.status(201);
                const timeout = await delay(1000 * 3);
                const readme = await chai.request(config.apiServerUrl)
                    .get(`/readme/algorithms/${algName}`)
                    .set("Authorization", `Bearer ${dev_token}`);

                //readme.body.readme.startsWith(readMeFile.startWith).should.be.true;
                const text = readme.body.readme.startsWith(readMeFile.startWith);
                expect(text).to.be.true;

                const del = await chai.request(config.apiServerUrl)
                    .delete(`/readme/algorithms/${algName}`)
                    .set("Authorization", `Bearer ${dev_token}`);
            }).timeout(1000 * 60 * 3);

            it('test the Get /readme/algorithms', async () => {
                const post = await chai.request(config.apiServerUrl)
                    .post(`/readme/algorithms/${algName}`)
                    .set("Authorization", `Bearer ${dev_token}`)
                    .attach("README.md", fs.readFileSync(readMeFile.FilePath), "README.md");
                const timeout = await delay(1000 * 2);
                const res = await chai.request(config.apiServerUrl)
                    .get(`/readme/algorithms/${algName}`)
                    .set("Authorization", `Bearer ${dev_token}`);

                expect(res).to.have.status(200);
                const text = res.body.readme.startsWith(readMeFile.startWith);
                expect(text).to.be.true;
                const del = await chai.request(config.apiServerUrl)
                    .delete(`/readme/algorithms/${algName}`)
                    .set("Authorization", `Bearer ${dev_token}`);
            }).timeout(1000 * 60 * 3);

            it('test the PUT /readme/algorithms', async () => {
                const post = await chai.request(config.apiServerUrl)
                    .post(`/readme/algorithms/${algName}`)
                    .set("Authorization", `Bearer ${dev_token}`)
                    .attach("README.md", fs.readFileSync(readMeFile.FilePath), "README.md");

                const res = await chai.request(config.apiServerUrl)
                    .put(`/readme/algorithms/${algName}`)
                    .set("Authorization", `Bearer ${dev_token}`)
                    .attach("README.md", fs.readFileSync(readMeSecondFile.FilePath), "README.md");

                write_log("res result =" + res.status);
                expect(res).to.have.status(200);
                const timeout = await delay(1000 * 2);
                const readme = await chai.request(config.apiServerUrl)
                    .get(`/readme/algorithms/${algName}`)
                    .set("Authorization", `Bearer ${dev_token}`);

                const text = readme.body.readme.startsWith(readMeSecondFile.startWith);
                expect(text).to.be.true;
                //readme.body.readme.startsWith(readMeSecondFile.startWith).should.be.true;

                const del = await chai.request(config.apiServerUrl)
                    .delete(`/readme/algorithms/${algName}`)
                    .set("Authorization", `Bearer ${dev_token}`);
            }).timeout(1000 * 60 * 3);

            it('test the Delete /readme/algorithms', async () => {
                const post = await chai.request(config.apiServerUrl)
                    .post(`/readme/algorithms/${algName}`)
                    .set("Authorization", `Bearer ${dev_token}`)
                    .attach("README.md", fs.readFileSync(readMeFile.FilePath), "README.md");

                const res = await chai.request(config.apiServerUrl)
                    .delete(`/readme/algorithms/${algName}`)
                    .set("Authorization", `Bearer ${dev_token}`);
                expect(res).to.have.status(200);

                const readme = await chai.request(config.apiServerUrl)
                    .get(`/readme/algorithms/${algName}`)
                    .set("Authorization", `Bearer ${dev_token}`);

                expect(readme).to.have.status(404);
            }).timeout(1000 * 60 * 3)
        });
    });

    describe('Webhooks', () => {
        const simplePipLine = require(path.join(process.cwd(), 'config/index')).swaggerCalls
        const pipe = simplePipLine.testData1.body

        it('test the Get webhooks/status/{jobId}', async () => {
            const jobId = await runStoredAndWaitForResults(pipe, dev_token);
            const timeout = await delay(1000 * 10);
            const res = await chai.request(config.apiServerUrl)
                .get(`/webhooks/status/${jobId}`)
                .set("Authorization", `Bearer ${dev_token}`);
            expect(res).to.have.status(200);
        }).timeout(1000 * 60 * 3);

        it('test the Get webhooks/results/{jobId}', async () => {
            const jobId = await runStoredAndWaitForResults(pipe, dev_token);
            const timeout = await delay(1000 * 10);
            const res = await chai.request(config.apiServerUrl)
                .get(`/webhooks/results/${jobId}`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res).to.have.status(200);
        }).timeout(1000 * 60 * 3);

        it('test the Get webhooks/list/{jobId}', async () => {
            const jobId = await runStoredAndWaitForResults(pipe, dev_token);
            const timeout = await delay(1000 * 10);
            const res = await chai.request(config.apiServerUrl)
                .get(`/webhooks/list/${jobId}`)
                .set("Authorization", `Bearer ${dev_token}`);
            expect(res).to.have.status(200);
        }).timeout(1000 * 60 * 3);
    });

    describe('Store Pipelines', () => {
        before('check if the pipeline addmultForTest is stored', async () => {
            const name = 'addmultForTest'
            const res = await chai.request(config.apiServerUrl)
                .get(`/store/pipeline/${name}`)
                .set("Authorization", `Bearer ${dev_token}`);

            if (res.status != 404) {
                await chai.request(config.apiServerUrl)
                    .delete('/store/pipelines/${name')
                    .set("Authorization", `Bearer ${dev_token}`);
            }
        });

        it('test the GET /store/pipelines/{name}', async () => {
            const name = 'simple'
            const res = await chai.request(config.apiServerUrl)
                .get(`/store/pipelines/${name}`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res).to.have.status(200);
        }).timeout(1000 * 60 * 3);

        it('test the POST /store/pipelines', async () => {
            const pipe = {
                name: 'addmultForTest',
                description: 'addmultForTest pipeline description',
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
                .set("Authorization", `Bearer ${dev_token}`)
                .send(pipe);

            expect(res).to.have.status(201);
        });

        it('should test the DELETE /store/pipelines/{name}', async () => {
            const name = 'addmultForTest';
            const res = await chai.request(config.apiServerUrl)
                .delete(`/store/pipelines/${name}`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res).to.have.status(200);
        });

        it('test the GET /store/pipelines', async () => {
            const res = await chai.request(config.apiServerUrl)
                .get('/store/pipelines')
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res).to.have.status(200);
            expect(res.body).to.have.lengthOf.above(1);
        });
    });

    describe('Experiment', () => {
        const experiment = {
            name: "new-experiment",
            description: "string description"
        }

        it('test  GET /experiment/{name}', async () => {
            const name = "main";
            const res = await chai.request(config.apiServerUrl)
                .get(`/experiment/${name}`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res).to.have.status(200);
            expect(res.body.name).to.be.equal(name);
        }).timeout(1000 * 60 * 2);

        it('test  POST Delete /experiment', async () => {
            const res = await chai.request(config.apiServerUrl)
                .post(`/experiment`)
                .set("Authorization", `Bearer ${dev_token}`)
                .send(experiment);

            expect(res).to.have.status(200);
            const ResDelete = await chai.request(config.apiServerUrl)
                .delete(`/experiment/${experiment.name}`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(ResDelete).to.have.status(200);
            const resGet = await chai.request(config.apiServerUrl)
                .get(`/experiment/${experiment.name}`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(resGet).to.have.status(404);
        }).timeout(1000 * 60 * 2);

        it('test /experiment​ list', async () => {
            const res = await chai.request(config.apiServerUrl)
                .get(`/experiment`)
                .set("Authorization", `Bearer ${dev_token}`);

            expect(res).to.have.status(200);
        }).timeout(1000 * 60 * 2);
    });

    describe('Build algorithm', () => {
        it(`build python algorithm from tra.gz`, async () => {
            const testalg = 'pyeyemat';
            const algName = pipelineRandomName(8).toLowerCase();
            const code1 = path.join(process.cwd(), 'additionalFiles/eyeMat.tar.gz');
            const buildStatusAlg = await buildAlgorithmAndWait({ code: code1, algName: algName, entry: testalg, kc_token: dev_token, algorithmArray: algList });
            expect(buildStatusAlg.status).to.be.equal("completed");
        }).timeout(1000 * 60 * 20);
    });

    describe('No correct role', () => {
        let guest_token;

        before(async function () {
            this.timeout(1000 * 60 * 15);
            guest_token = await loginWithRetry(config.keycloakGuestUser, config.keycloakGuestPass);
        });

        it('should fail to DELETE /store/pipelines/{name} via REST', async () => {
            const name = 'addmultForTest';

            const res = await chai.request(config.apiServerUrl)
                .delete(`/store/pipelines/${name}`)
                .set("Authorization", `Bearer ${guest_token}`);
            if (guest_token) {
                expect(res.text).to.eql("Access denied");
                expect(res).to.have.status(403);
            }
        }).timeout(1000 * 60 * 2);

        it('should fail to POST /exec/stored/ via REST', async () => {
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
                .set("Authorization", `Bearer ${guest_token}`)
                .send(pipe);

            if (guest_token) {
                expect(res.text).to.eql("Access denied");
                expect(res).to.have.status(403);
            }
        }).timeout(1000 * 60 * 2);

        it('should fail to POST /cron/start/ via REST', async () => {
                const cronBody = {
                name: "simple",
                pattern: "0 0 * * *",
            }

            const res = await chai.request(config.apiServerUrl)
                .post('/cron/start')
                .set("Authorization", `Bearer ${guest_token}`)
                .send(cronBody);

            if (guest_token) {
                expect(res.text).to.eql("Access denied");
                expect(res).to.have.status(403);
            }
        }).timeout(1000 * 60 * 2);
    });
});
