const chai = require('chai');
const path = require('path');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const assertArrays = require('chai-arrays');
const delay = require('delay');
const config = require('../config/config');


const {
    pipelineRandomName
} = require('../utils/pipelineUtils')

const {
    getRawGraph
} = require('../utils/results')

const {
    buildAlgorithmAndWait,
    runAlgGetResult,
    deleteAlgorithm,
    buildGitAlgorithm
} = require('../utils/algorithmUtils')

const { loginWithRetry } = require('../utils/misc_utils');

chai.use(chaiHttp);
chai.use(assertArrays);

// const exceSyncString = async (command) => {
//     console.log("start- " + command);
//     output = execSync(command);
//     const noColor = output.toString('utf8').replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
//     console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
//     console.log(noColor);
//     console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
//     return noColor;
// }

// const execSyncReturenJSON = async (command) => {
//     const noColor = await exceSyncString(command);
//     const obj = yaml.load(noColor);
//     const result = JSON.stringify(obj, null, 2);
//     const jsonResult = JSON.parse(result);
//     console.log("execSyncReturenJSON return typeof jsonResult = " + typeof jsonResult);
//     return jsonResult;
// }

// const createErrorAlg = async () => {
//     if (!errorExsis) {
//         const code = path.join(process.cwd(), 'additionalFiles/pythonAlg/erroralg.zip'); //pythonApi.tar.gz
//         const entry = 'main';
//         const pythonVersion = "python:3.7";
//         const buildStatusAlg = await buildAlgorithmAndWait({ code: code, algName: "error-alg", entry: entry, baseVersion: pythonVersion });
//         expect(buildStatusAlg.status).to.be.equal("completed");
//         errorExsis = true;
//     }
// }

describe('code api tests ', () => {
    let dev_token;

    before(async function () {
        this.timeout(1000 * 60 * 15);
        dev_token = await loginWithRetry();
    });

    let algList = [];

    const createAlg = async (obj, token = {}, isGit = false) => {
        obj.algorithmArray = algList;
        obj.kc_token = token;
        await deleteAlgorithm(obj.algName, token, true);
        const buildStatusAlg = isGit ? await buildGitAlgorithm(obj) : await buildAlgorithmAndWait(obj);
        expect(buildStatusAlg.status).to.be.equal("completed");
        return buildStatusAlg;
    }

    beforeEach(function () {
        console.log('\n-----------------------------------------------\n');
    });

    after(async function () {
        this.timeout(2 * 60 * 1000);
        console.log("sater after");
        console.log("algList = " + algList);
        j = 0;
        z = 3;

        while (j < algList.length) {
            delAlg = algList.slice(j, z);
            const del = delAlg.map((e) => {
                return deleteAlgorithm(e, dev_token, true);
            });
            console.log("delAlg-", JSON.stringify(delAlg, null, 2));
            const delResult = await Promise.all(del);
            delResult.forEach(result => {
                if (result && result.text) {
                    try {
                        const parsedText = JSON.parse(result.text);
                        if (parsedText.message) {
                            console.log("Delete Result Message:", parsedText.message);
                        }
                    }
                    catch (error) {
                        console.error(result.error.message || error);
                    }
                }
            });
            await delay(2000);
            j += 3;
            z += 3;
            console.log("j=" + j + ",z=" + z);
        }
        console.log("----------------------- end -----------------------");
    });

    describe("python code API", () => {
        const algName = `codeapi-python-${pipelineRandomName(4).toLowerCase()}`;
        const obj = {
            algName,
            code: path.join(process.cwd(), 'additionalFiles/pythonAlg/pythonApi.tar.gz'), //pythonApi.tar.gz
            entry: 'main',
            pythonVersion: "python:3.7"
        };

        before(async function () {
            this.timeout(1000 * 60 * 15);
            await createAlg(obj, dev_token); // All tests use this algorithm - building it once, for the tests to take less time.
        });

        // const getResultFromStorage = async (storagePath) => {
        //     const res = await chai.request(config.apiServerUrl)
        //         .get(`/storage/values/${storagePath}`);
        //     return res;
        // }

        it("start algorithm", async () => {
            const startAlg = [
                {
                    action: "start_alg",
                    name: "green-alg",
                    input: [42]
                }
            ];
            const result = await runAlgGetResult(algName, startAlg, dev_token);
            console.log(result);
            expect(result.data[0].result).to.be.equal(42);
            const graph = await getRawGraph(result.jobId, dev_token);
            expect(graph.body.nodes.length).to.be.equal(2);
        }).timeout(1000 * 60 * 10);

        // error alg code:
        // def start(args, hkubeapi):
        //     if (len(args['input']) and args['input'][0].get('mem_fail')):
        //         print('allocate large memory')
        //         large_mem = b'\xdd'*1000*1000*1000
        //         print('after alloc')
        //     if (len(args['input']) and args['input'][0].get('error_fail')):
        //         print('error fail')
        //         raise ValueError('A very specific bad thing happened.')
        //         print('after alloc')

        it("start algorithm with mem error", async () => {
            const startAlg = [
                {
                    action: "start_alg",
                    name: "error-alg",
                    input: [
                        {
                            "mem_fail": true
                        }
                    ]
                }
            ];
            const result = await runAlgGetResult(algName, startAlg, dev_token);
            console.log(result);
        }).timeout(1000 * 60 * 10);

        it("start algorithm with alg error", async () => {
            const startAlg = [
                {
                    action: "start_alg",
                    name: "error-alg",
                    input: [
                        {
                            "error_fail": true
                        }
                    ]
                }
            ];
            const result = await runAlgGetResult(algName, startAlg, dev_token);
            console.log(result);
        }).timeout(1000 * 60 * 10);

        it("start stored pipeline", async () => {
            const startPipe = [
                {
                    "action": "start_stored_subpipeline",
                    "name": "simple",
                    "flowInput": {
                        "files": {
                            "link": "links-1"
                        }
                    }
                }
            ];
            const result = await runAlgGetResult(algName, startPipe, dev_token);
            expect(result.data[0].result.result).to.be.equal('links-1');
        }).timeout(1000 * 60 * 10);

        // const y = {
        //     "action": "start_stored_subpipeline",
        //     "name": "simple",
        //     "flowInput": {
        //         "files": {
        //             "link": "links-1"
        //         }
        //     }
        // }

        it("start raw pipeline", async () => {
            const startRaw = [
                {
                    action: "start_raw_subpipeline",
                    name: "raw-simple",
                    nodes: [
                        {
                            "nodeName": "one",
                            "algorithmName": "green-alg",
                            "input": [42]
                        }
                    ],
                    flowInput: {}
                }
            ];
            const result = await runAlgGetResult(algName, startRaw, dev_token);
            console.log(result);
            expect(result.data[0].result[0].result).to.be.equal(42);
        }).timeout(1000 * 60 * 10);
    });

    xdescribe("Node JS code API", () => {
        const algName = `codeapi-nodejs-${pipelineRandomName(4).toLowerCase()}`;
        const obj = {
            algName,
            entry: 'hkubeApi',
            language: 'nodejs',
            gitUrl: "https://github.com/tamir321/hkube-js-algorithm.git",
            branch: "main",
            gitKind: "github"
        }

        before(async function () {
            this.timeout(1000 * 60 * 15);
            await createAlg(obj, dev_token, true); // All tests use this algorithm - building it once, for the tests to take less time.
        });

        it("Node start algorithm", async () => {
            const startAlg = [
                {
                    "action": "startAlg",
                    "algName": "green-alg",
                    "input": [42]
                }
            ];
            const result = await runAlgGetResult(algName, startAlg, dev_token);
            console.log(result);
            expect(result.data[0].result).to.be.equal(42);
            const graph = await getRawGraph(result.jobId, dev_token);
            expect(graph.body.nodes.length).to.be.equal(2);
        }).timeout(1000 * 60 * 10);

        it("Node start stored pipeline", async () => {
            const startPipe = [
                {
                    "action": "startStored",
                    "pipeName": "simple",
                    "input": {
                        "inp": 42
                    }
                }
            ];
            const result = await runAlgGetResult(algName, startPipe, dev_token);
            console.log(result);
            expect(result.data[0].result[0].result).to.be.equal('links-1');
        }).timeout(1000 * 60 * 10);

        it("node start raw pipelien", async () => {
            const startRaw = [
                {
                    "action": "startRaw", "pipeName": "raw",
                    "pipNodes": "[{\"algorithmName\": \"green-alg\",\"input\": [\"@flowInput.bar\"],\"nodeName\": \"a\"},{\"algorithmName\": \"yellow-alg\",\"input\": [\"@a\"], \"nodeName\": \"b\"}]"
                    , "input": { "bar": { "size": "3", "batch": "4" } }
                }
            ];
            const result = await runAlgGetResult(algName, startRaw, dev_token);
            console.log(result.data[0]);
            expect(result.data[0].result[0].result.size).to.be.equal("3");
        }).timeout(1000 * 60 * 10);
    });

    xdescribe("Java code API", () => {
        const algName = pipelineRandomName(8).toLowerCase();
        const obj = {
            algName,
            entry: 'javaApi',
            language: 'java',
            gitUrl: "https://github.com/tamir321/hkubeJava.git",
            branch: "master",
            gitKind: "github"
        }

        // const r = {
        //     "action": "startAlg",
        //     "algName": "green-alg",
        //     "alginput": ["4"]
        // }

        before(async function () {
            this.timeout(1000 * 60 * 15);
            await createAlg(obj, dev_token);
        });

        it("Java start algorithm", async () => {
            const startAlg = [
                {
                    action: "startAlg",
                    algName: "green-alg",
                    alginput: [42]
                }
            ];
            const result = await runAlgGetResult(algName, startAlg, dev_token);
            console.log(result);
            expect(result.data[0].result.response).to.be.equal(42);
            const graph = await getRawGraph(result.jobId, dev_token);
            expect(graph.body.nodes.length).to.be.equal(2);
        }).timeout(1000 * 60 * 10);

        it("Java start algorithm binary", async () => {
            const startAlg = [
                {
                    action: "startAlgBinary",
                    algName: "green-alg",
                    alginput: [42]
                }
            ];
            const result = await runAlgGetResult(algName, startAlg, dev_token); //await runAlgGetResult(algName,startAlg)
            console.log(result);
            expect(result.data[0].info.size).to.be.greaterThan(300000); // should returen an image size (337 kB)  
            const graph = await getRawGraph(result.jobId, dev_token);
            expect(graph.body.nodes.length).to.be.equal(2);
        }).timeout(1000 * 60 * 10);

        it("Java start stored pipeline", async () => {
            const startPipe = [
                {
                    action: "startStored",
                    PipeName: "simple",
                    PipeInput: [42]
                }
            ];
            const result = await runAlgGetResult(algName, startPipe, dev_token);
            console.log(result);

            expect(result.data[0].result[0].result).to.be.equal('links-1');
        }).timeout(1000 * 60 * 10);

        it("Java start raw pipelien", async () => {
            const startRaw = [
                {
                    action: "startRaw",
                    PipeName: "raw-simple"
                }
            ];
            const result = await runAlgGetResult(algName, startRaw, dev_token);
            console.log(result);
            expect(result.data[0].result[0].result.empty).to.be.equal(false);
            //const path = result.data[0].result.result.storageInfo.path;
            // const res = await getResultFromStorage(path);
            // expect(res.body[0].result).to.be.equal(42);
        }).timeout(1000 * 60 * 10);
    });
});
