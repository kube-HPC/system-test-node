const chai = require('chai');
const path = require('path');
const chaiHttp = require('chai-http');
const delay = require('delay');
const expect = chai.expect;
const assertArrays = require('chai-arrays');
const { execSync, spawn } = require('child_process');
const config = require('../config/config');
const { StatusCodes } = require('http-status-codes');
const fs = require('fs');

const {
    pipelineRandomName,
    getPipeline,
    deletePipeline,
    storePipeline,
    deconstructTestData,
    getPipelineStatus,
    runStored
} = require('../utils/pipelineUtils');

const {
    pipelineDevFolder
} = require("../config/index").syncTest;

const {
    getJobIdStatus,
    getResult,
    getStatusall
} = require('../utils/results');

const {
    syncAlg
} = require('../additionalFiles/defaults/algorithms/sync-dev-folder.js');

const {
    runAlgGetResult,
    getAlgorithm,
    storeAlgorithmApply,
    deleteAlgorithm,
    getBuildList
} = require('../utils/algorithmUtils');

chai.use(chaiHttp);
chai.use(assertArrays);
const yaml = require('js-yaml');


const runHkubectlConfig = () => {
    return new Promise((resolve, reject) => {
        console.log("Using URL: " + config.baseUrl + " and " + config.keycloakDevUser + " user for hkubectl configuration...");
        const configProcess = spawn('hkubectl', ['config']);
        const inputs = [
            config.baseUrl + '\n',
            'false\n',
            config.keycloakDevUser + '\n',
            config.keycloakDevPass + '\n'
        ];

        let step = 0;
        let isWriting = false;
        let outputBuffer = ''; // to capture stdout for checking login result

        configProcess.stdout.on('data', (data) => {
            const output = data.toString();
            outputBuffer += output;
            // process.stdout.write(output); // debug

            if (!isWriting && step < inputs.length && /Enter|Verify/.test(output)) {
                isWriting = true;
                delay(1000).then(() => {
                    configProcess.stdin.write(inputs[step]);
                    step++;
                    isWriting = false;
                });
            }
        });

        configProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        configProcess.on('close', (code) => {
            if (/Login failed/i.test(outputBuffer)) {
                reject(new Error('hkubectl login failed'));
            } else if (code === 0) {
                console.log('hkubectl configured successfully');
                resolve();
            } else {
                reject(new Error(`hkubectl config failed with exit code ${code}`));
            }
        });
    });
};

const exceSyncString = async (command) => {
    console.log("start- " + command);
    output = execSync(command);
    const noColor = output.toString('utf8').replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
    console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    console.log(noColor);
    console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    return noColor;
}

const execSyncReturenJSON = async (command) => {
    const noColor = await exceSyncString(command);
    const obj = yaml.load(noColor);
    const result = JSON.stringify(obj, null, 2);

    const jsonResult = JSON.parse(result);

    console.log("execSyncReturenJSON return typeof jsonResult = " + typeof jsonResult);
    return jsonResult;
}

describe('Hkubectl Tests', () => {
    let algList = [];
    let pipeList = [];
    let filePathList = [];
    let testUserBody;
    before(async function () {
        this.timeout(1000 * 60 * 15);
        testUserBody = {
            username: config.keycloakDevUser,
            password: config.keycloakDevPass
        }
        const response = await chai.request(config.apiServerUrl)
            .post('/auth/login')
            .send(testUserBody)
        if (response.status === StatusCodes.OK) {
            console.log(config.keycloakDevUser + ' login success');
            dev_token = response.body.data.access_token;

            await runHkubectlConfig();
        }
        else {
            console.log(config.keycloakDevUser + ' login failed - no keycloak/bad credentials');
        }
    });
    let dev_token;
    // Use this method to apply algorithms, as it ensures that the algorithms are inserted into the algList.
    // This, in turn, guarantees that no unnecessary data is left behind by properly removing those algorithms.
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
                return deleteAlgorithm(e, dev_token, true);
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

        console.log("-----------------------------------------------");
        console.log("filePathList = " + filePathList);
        j = 0;
        z = 3;

        while (j < filePathList.length) {
            let delFiles = filePathList.slice(j, z);
            const del = delFiles.map((filePath) => {
                return new Promise((resolve) => {
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.warn(`Failed to delete file ${filePath}: ${err.message}`);
                        } else {
                            console.log(`Successfully deleted file: ${filePath}`);
                        }
                        resolve();
                    });
                });
            });
            await Promise.all(del);
            await delay(2000);
            j += 3;
            z += 3;
        }
        console.log("----------------------- end -----------------------");
    });

    describe('hkubecl algorithm tests', () => {
        it.only('hkube algorithm list', async () => {
            const runSimple = "hkubectl algorithm list --json";
            const jsonResult = await execSyncReturenJSON(runSimple);
            console.log(jsonResult);
            console.log("jsonResult.length-" + jsonResult.length);
            expect(jsonResult.length).to.be.above(6);
        }).timeout(1000 * 60 * 6);

        it('hkube algorithm get', async () => {
            const runSimple = "hkubectl algorithm get green-alg --json";
            const jsonResult = await execSyncReturenJSON(runSimple);
            console.log(jsonResult);
            expect(jsonResult.name).to.be.equal('green-alg');
        }).timeout(1000 * 60 * 6);

        xit('hkube algorithm apply', async () => {
            const algName = pipelineRandomName(8).toLowerCase();
            algList.push(algName);
            const filePath = path.join(process.cwd(), 'additionalFiles/python.versions.tar.gz');
            const runBulid = `hkubectl algorithm apply ${algName} ` +
                `--env python ` +
                `--codeEntryPoint main35 ` +
                `--gpu 0 ` +
                `--cpu 1 ` +
                `--mem 256Mi ` +
                `--codePath ${filePath} `;

            await exceSyncString(runBulid);
            const result = await runAlgGetResult(algName, [4], dev_token);
            await deleteAlgorithm(algName, dev_token, true);
            expect(result.data[0].result.version.toString()).to.be.equal("3.5");
        }).timeout(1000 * 60 * 6);

        xit('hkube algorithm apply from file and delete', async () => {
            const algName = pipelineRandomName(8).toLowerCase();
            algList.push(algName);
            const algFile = path.join(process.cwd(), './additionalFiles/alg.yaml');
            let fileContents = fs.readFileSync(algFile, 'utf8');
            let data = yaml.safeLoad(fileContents);
            data.name = `${algName}`;
            let yamlStr = yaml.safeDump(data);
            fs.writeFileSync(algFile, yamlStr, 'utf8');

            const runBulid = `hkubectl algorithm apply ` +
                `-f ${algFile}`;
            await exceSyncString(runBulid);
            delay(5000);
            const result = await runAlgGetResult(algName, [4], dev_token);

            expect(result.data[0].result.version.toString()).to.be.equal("3.5");

            const deleteAlg = `hkubectl algorithm delete ${algName}`;
            await exceSyncString(deleteAlg);

            const alg = await getAlgorithm(algName, dev_token);
            console.log(alg.body);
            expect(alg.status).to.be.equal(404);
        }).timeout(1000 * 60 * 10);

        it('hkube algorithm apply alg version', async () => {
            const algName = pipelineRandomName(8).toLowerCase();
            algList.push(algName);
            let trgzFile = 'version1.tar.gz';
            let runBulid = `hkubectl algorithm apply ${algName} ` +
                `--env python ` +
                `--codeEntryPoint main ` +
                `--gpu 0 ` +
                `--cpu 1 ` +
                `--mem 256Mi ` +
                `--codePath ./additionalFiles/${trgzFile} `;
            trgzFile2 = 'version2.tar.gz';
            let runBulidV2 = `hkubectl algorithm apply ${algName} ` +
                `--env python ` +
                `--codeEntryPoint mainv1 ` +
                `--gpu 0 ` +
                `--cpu 1 ` +
                `--mem 256Mi ` +
                `--codePath ./additionalFiles/${trgzFile2} `;
            console.log("start build 1");
            await exceSyncString(runBulid);
            console.log("start build 2");
            await exceSyncString(runBulidV2);
            const result = await runAlgGetResult(algName, [4], dev_token);
            expect(result.data[0].result.version.toString()).to.be.equal("1.1");
        }).timeout(1000 * 60 * 15);

        it('hkube algorithm apply alg version setCurrent', async () => {
            const algName = pipelineRandomName(8).toLowerCase();
            algList.push(algName);
            let trgzFile = 'version1.tar.gz';
            let runBulid = `hkubectl algorithm apply ${algName} ` +
                `--env python ` +
                `--codeEntryPoint main ` +
                `--gpu 0 ` +
                `--cpu 1 ` +
                `--mem 256Mi ` +
                `--codePath ./additionalFiles/${trgzFile} `;
            trgzFile2 = 'version2.tar.gz';
            let runBulidV2 = `hkubectl algorithm apply ${algName} ` +
                `--env python ` +
                `--codeEntryPoint mainv1 ` +
                `--gpu 0 ` +
                `--cpu 1 ` +
                `--mem 256Mi ` +
                `--setCurrent true ` +
                `--codePath ./additionalFiles/${trgzFile2} `;
            console.log("start build 1");
            await exceSyncString(runBulid);

            console.log("start build 2");
            await exceSyncString(runBulidV2);

            const result = await runAlgGetResult(algName, [4], dev_token);
            expect(result.data[0].result.version.toString()).to.be.equal("1.1");
        }).timeout(1000 * 60 * 10);

        it('hkube algorithm apply nowait', async () => {
            const algName = pipelineRandomName(8).toLowerCase();
            algList.push(algName);
            const runBulid = `hkubectl algorithm apply ${algName} ` +
                `--env python ` +
                `--codeEntryPoint main35 ` +
                `--gpu 0 ` +
                `--cpu 1 ` +
                `--mem 256Mi ` +
                `--codePath ./additionalFiles/python.versions.tar.gz ` +
                `--noWait`;

            await exceSyncString(runBulid);

            const builds = await getBuildList(algName, dev_token);
            console.log(builds);
            await getStatusall(builds[0].buildId, `/builds/status/`, 200, "completed", dev_token, 1000 * 60 * 10);
            const result = await runAlgGetResult(algName, [4], dev_token);
            await deleteAlgorithm(algName, dev_token, true);
            expect(result.data[0].result.version.toString()).to.be.equal("3.5");
        }).timeout(1000 * 60 * 6);
    });

    describe('hkubecl pipeline tests', () => {
        it('pipeline get', async () => {
            const get = "hkubectl pipeline get simple  --json";
            const output = await exceSyncString(get);

            //  const expected = ["name","simple"]
            const result = JSON.parse(output);

            expect(result.result.name).to.be.equal('simple');
        }).timeout(1000 * 60 * 6);

        it('pipeline store from file', async () => {
            const pipelineName = pipelineRandomName(8).toLowerCase();
            const pipelineFile = './pipelines/simpelraw.json';
            const pipelineTemp = './pipelines/temp.json';
            filePathList.push(pipelineTemp);
            let fileContents = fs.readFileSync(pipelineFile, 'utf8');
            let data = JSON.parse(fileContents);
            data.name = `${pipelineName}`;
            let jsonStr = JSON.stringify(data);
            fs.writeFileSync(pipelineTemp, jsonStr, 'utf8');

            const store = `hkubectl pipeline store -f ` + pipelineTemp;
            await exceSyncString(store);

            const pipe = await getPipeline(pipelineName, dev_token);
            expect(pipe.body.name).to.be.equal(pipelineName);
            await deletePipeline(pipelineName, dev_token);
        }).timeout(1000 * 60 * 6);
    });

    describe('hkubecl exec tests', () => {
        it('exec stored pipe wait', async () => {

            console.log("start");
            const runSimple = "hkubectl exec stored simple ";

            const jsonResult = await execSyncReturenJSON(runSimple);;
            expect(jsonResult.jobResult[0].result).to.be.equal('links-1');
        }).timeout(1000 * 60 * 6);

        it('exec stored pipe noWait', async () => {
            const runSimple = "hkubectl exec stored simple --noWait";

            const jsonResult = await execSyncReturenJSON(runSimple);

            console.log(jsonResult);
            const result = await getResult(jsonResult.jobId, 200, dev_token);
            console.log(result);
            expect(result.data[0].result).to.be.equal('links-1');
        }).timeout(1000 * 60 * 6);

        it('exec raw pipe', async () => {
            const runSimple = "hkubectl exec raw -f ./pipelines/simpelraw.json";
            //const jsonResult = await execSyncReturenJSON(runSimple)
            const output = await execSync(runSimple + " --json");

            const jsonResult = output.toString('utf8');
            console.log(jsonResult);
            const js = JSON.parse(jsonResult);
            console.log("jobId =" + js.jobId);
            const result = await getResult(js.jobId, 200, dev_token);
            console.log(result);
            expect(result.data[0].result).to.be.equal('links-1');
        }).timeout(1000 * 60 * 6);

        it('exec algorithm wait', async () => {
            console.log("start");
            const runSimple = "hkubectl exec algorithm green-alg ";

            const jsonResult = await execSyncReturenJSON(runSimple);
            console.log(jsonResult);
            expect(jsonResult.jobResult[0].nodeName).to.be.equal('green-alg');
        }).timeout(1000 * 60 * 6);

        it('exec algorithm noWait', async () => {
            const runSimple = "hkubectl exec algorithm green-alg --noWait";
            const jsonResult = await execSyncReturenJSON(runSimple);

            console.log(jsonResult);
            const result = await getResult(jsonResult.jobId, 200, dev_token);
            console.log(result);
            expect(result.data[0].result).to.be.equal(null);
        }).timeout(1000 * 60 * 6);

        it('exec stop pipe', async () => {
            const runSimple = "hkubectl exec stored simple --noWait";
            const jsonResult = await execSyncReturenJSON(runSimple);

            console.log(jsonResult);

            const stop = `hkubectl exec stop ${jsonResult.jobId} "stop by test"`;

            const stopResult = await execSyncReturenJSON(stop);
            console.log(stopResult);
            const result = await getResult(jsonResult.jobId, 200, dev_token);
            console.log(result);
            expect(result.status).to.be.equal("stopped");
        }).timeout(1000 * 60 * 6);

        it('exec status pipe', async () => {
            const runSimple = "hkubectl exec stored simple --noWait";
            const jsonResult = await execSyncReturenJSON(runSimple);
            console.log("=======================");
            console.log(jsonResult);
            console.log("=======================");
            const status = `hkubectl exec status ${jsonResult.jobId}`;
            const array = [];
            array.push(execSyncReturenJSON(status));
            array.push(getJobIdStatus(jsonResult.jobId, dev_token));
            const statuses = await Promise.all(array);
            expect(statuses[0].result.status).to.be.equal(statuses[1].body.status);
        }).timeout(1000 * 60 * 6);

        it('exec get pipe', async () => {
            const get = "hkubectl pipeline get simple --json";
            //const output = await exceSyncString(get);
            //const expected = ["name","simple"]
            //const result = output.split("\n")

            //expect(expected.filter(a=>result[1].includes(a)).length).to.be.equal(2)
            const output = await exceSyncString(get);

            //  const expected = ["name","simple"]
            const result = JSON.parse(output);

            expect(result.result.name).to.be.equal('simple');
        }).timeout(1000 * 60 * 6);

        it('exec results pipe', async () => {
            const runSimple = "hkubectl exec stored simple --noWait";
            const jsonResult = await execSyncReturenJSON(runSimple);
            console.log(jsonResult);
            const result = await getResult(jsonResult.jobId, 200, dev_token);
            console.log(result);

            const cti = " hkubectl exec result --jobId = " + jsonResult.jobId;
            const output = await exceSyncString(cti);;

            //const ctlResult = await execSyncReturenJSON(cti)

            console.log(result);
            expect(output.replace(/^\s+|\s+$/gm, '').trim()).to.contain("result:        links-1");
        }).timeout(1000 * 60 * 6);
    });

    describe('sync test', () => {
        const delay = require('delay');
        function execShellCommand(cmd) {
            const exec = require('child_process').exec;
            return new Promise((resolve, reject) => {
                exec(cmd, (error, stdout, stderr) => {
                    if (error) {
                        console.warn(error);
                    }
                    resolve(stdout ? stdout : stderr);
                });
            });
        }

        it('sync create watch changes python', async () => {
            const filePath = path.join(process.cwd(), 'additionalFiles/main.py');
            const algName = pipelineRandomName(8).toLowerCase();
            algList.push(algName);
            const folderPath = path.join(process.cwd(), algName);
            var fs = require('fs');

            if (!fs.existsSync(algName)) {
                fs.mkdirSync(algName);
            }

            var data = fs.readFileSync(filePath, 'utf8');
            filePathList.push(`${folderPath}/main.py`);
            fs.writeFileSync(`${folderPath}/main.py`, data, { encoding: 'utf8', flag: 'w' });

            const command = ` hkubectl sync create` +
                ` --entryPoint main.py` +
                ` --algorithmName ${algName}` +
                ` --folder ${folderPath}` +
                ` --env python`;
            console.log(command);
            console.log("2");
            await exceSyncString(command);
            console.log("3");
            const watch = `hkubectl sync watch` +
                ` -a ${algName}` +
                ` -f ${folderPath}`;

            execShellCommand(watch);
            console.log("4");
            await delay(20 * 1000);
            console.log("5");
            const result = await runAlgGetResult(algName, [4], dev_token);

            //  await deleteAlgorithm(algName,true)    
            expect(result.data[0].result.version.toString()).to.be.equal("1");

            const newmain = data.replace(`"version":"1"`, `"version":"2"`);
            console.log("6");
            fs.writeFileSync(`${folderPath}/main.py`, newmain, { encoding: 'utf8', flag: 'w' });
            console.log("7");
            await delay(20 * 1000);

            const result2 = await runAlgGetResult(algName, [4], dev_token);
            await deleteAlgorithm(algName, dev_token, true);
            expect(result2.data[0].result.version.toString()).to.be.equal("2");
        }).timeout(1000 * 60 * 10);

        it('sync python alg with requirements', async () => {
            const folderPath = path.join(process.cwd(), 'additionalFiles/pythonAlg');
            const algName = pipelineRandomName(8).toLowerCase();
            algList.push(algName);
            console.log("alg-name-" + algName);
            var fs = require('fs');

            const command = ` hkubectl sync create` +
                ` --entryPoint ${algName}.py` +
                ` --algorithmName ${algName}` +
                ` --folder ${folderPath}` +
                ` --env python`;

            console.log(command);
            await exceSyncString(command);
            const watch = `hkubectl sync watch` +
                ` -a ${algName}` +
                ` -f ${folderPath}`;
            console.log("watch-" + watch);
            execShellCommand(watch);
            var filePath = `${folderPath}/main.py`;

            var data = fs.readFileSync(filePath, 'utf8');
            filePathList.push(`${folderPath}/${algName}.py`);
            fs.writeFileSync(`${folderPath}/${algName}.py`, data, { encoding: 'utf8', flag: 'w' });

            await delay(40 * 1000);

            const result = await runAlgGetResult(algName, [4], dev_token);
            console.log(result);
            deleteAlgorithm(algName, dev_token);
        }).timeout(1000 * 60 * 10);

        it('sync python alg ignore files', async () => {
            //the folder containg hkubeignore that has one line to ignore *.txt
            const folderPath = path.join(process.cwd(), 'additionalFiles/pythonIgnoreFile');

            const algName = pipelineRandomName(8).toLowerCase();
            algList.push(algName);
            console.log("alg-name-" + algName);
            var fs = require('fs');

            const command = ` hkubectl sync create` +
                ` --entryPoint ${algName}.py` +
                ` --algorithmName ${algName}` +
                ` --folder ${folderPath}` +
                ` --env python`;

            console.log(command);
            await exceSyncString(command);
            const watch = `hkubectl sync watch` +
                ` -a ${algName}` +
                ` -f ${folderPath}`;
            console.log("watch-" + watch);
            execShellCommand(watch);
            var filePath = `${folderPath}/main.py`;

            var data = fs.readFileSync(filePath, 'utf8');
            filePathList.push(`${folderPath}/${algName}.py`);
            fs.writeFileSync(`${folderPath}/${algName}.py`, data, { encoding: 'utf8', flag: 'w' });

            await delay(20 * 1000);

            const result = await runAlgGetResult(algName, [4], dev_token);
            console.log(result);
            //when running from local there are 6 txt file
            expect(result.data[0].result).to.be.equal(6);

            const alg = await getAlgorithm(algName, dev_token);
            const image = alg.body.algorithmImage;

            const newName = algName + "-new";
            const alg1 = {
                name: newName,
                cpu: 1,
                gpu: 0,
                mem: "256Mi",
                minHotWorkers: 0,
                algorithmImage: image,
                type: "Image",
                options: {
                    debug: false,
                    pending: false
                },
                workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 2000 }
            }

            await applyAlg(alg1, dev_token);
            const result1 = await runAlgGetResult(newName, [4], dev_token);
            console.log(result);
            expect(result1.data[0].result).to.be.equal(0);
        }).timeout(1000 * 60 * 10);

        it('sync start algorithm should have required properties devMode and devFolder', async () => {
            const somealg = {
                name: "somealg",
                cpu: 0.1,
                gpu: 0,
                mem: "128Mi",
                minHotWorkers: 0,
                algorithmImage: "docker.io/hkubedevtest/lonstringv3:vq2vozy33",
                type: "Image",
                options: {
                    debug: false,
                    pending: false
                }
            }
            await deleteAlgorithm(somealg.name, dev_token);
            const storeresult = await applyAlg(somealg, dev_token);
            console.log(storeresult.result);

            const startCommand = ` hkubectl sync start` +
                ` --algorithmName ${somealg.name}` +
                ` --devFolder ${process.cwd()}`;

            console.log(startCommand);
            await exceSyncString(startCommand);

            await delay(10 * 1000);

            const alg = await getAlgorithm(somealg.name, dev_token);
            const { devMode, devFolder } = alg.body.options;

            expect(devFolder).to.be.equal(process.cwd());
            expect(devMode).to.be.equal(true);
        }).timeout(1000 * 60 * 10);

        it('sync stop algorithm should have devMode = false, and no devFolder', async () => {
            const somealg = {
                name: "somealg",
                cpu: 0.1,
                gpu: 0,
                mem: "128Mi",
                minHotWorkers: 0,
                algorithmImage: "docker.io/hkubedevtest/lonstringv3:vq2vozy33",
                type: "Image",
                options: {
                    debug: false,
                    pending: false
                }
            }
            await deleteAlgorithm(somealg.name, dev_token);
            const storeresult = await applyAlg(somealg, dev_token);
            console.log(storeresult.result);

            const stopCommand = ` hkubectl sync stop` +
                ` --algorithmName ${somealg.name}`;

            console.log(stopCommand);
            await exceSyncString(stopCommand);

            await delay(10 * 1000);

            const alg = await getAlgorithm(somealg.name, dev_token);
            const { devMode, devFolder } = alg.body.options;

            expect(devFolder).to.be.equal(null);
            expect(devMode).to.be.equal(false);
        }).timeout(1000 * 60 * 10)

        it('sync an algorithm with a custom path using start,stop, and a devFolder', async () => {
            const randomName = pipelineRandomName(8).toLowerCase();
            const algName = "sync-dev-folder" + randomName;
            syncAlg.name = algName;
            await applyAlg(syncAlg, dev_token);
            const localFolder = path.join(process.cwd(), 'additionalFiles/file1');
            // create and push pipeline with sync-dev-folder alg, input being devFolder = "/somePath"
            const testData = pipelineDevFolder;
            testData.descriptor.nodes[0].algorithmName = algName;
            testData.descriptor.name = algName;
            const devContainerFolder = testData.descriptor.nodes[0].input[0].devFolder;
            const devPipeline = deconstructTestData(testData);
            await deletePipeline(devPipeline, dev_token);
            await storePipeline(devPipeline, dev_token, pipeList);
            // start the sync process
            const startCommand = ` hkubectl sync start` +
                ` --algorithmName ${algName}` +
                ` --devFolder ${devContainerFolder}`;

            console.log(startCommand);
            await exceSyncString(startCommand);
            let res = await runStored(devPipeline, dev_token);
            await delay(50 * 1000);
            // get status before watch
            let pipelineData = await getPipelineStatus(res.body.jobId, dev_token);
            expect(pipelineData.body.status).be.equal('failed');

            // // sync watch
            const watch = `hkubectl sync watch` +
                ` -a ${algName}` +
                ` -f ${localFolder}`;
            console.log("watch-" + watch);
            execShellCommand(watch);

            res = await runStored(devPipeline, dev_token);
            await delay(60 * 1000);
            // get status
            pipelineData = await getPipelineStatus(res.body.jobId, dev_token);
            expect(pipelineData.body.status).be.equal('completed');
        }).timeout(1000 * 60 * 10);
    });

    describe('hkubectl export tests', () => {
        it('export algoritms as jsons to a local directory ', async () => {
            const rimraf = require('rimraf');
            const folderPath = './additionalFiles/exportedAlgorithms';
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath);
            }
            const exportAlgoCommand = `hkubectl export algorithms ${folderPath}`;
            const exportAlgorithms = await execSync(exportAlgoCommand);
            let files = fs.readdirSync(folderPath, 'utf8');
            expect(files.length).to.be.greaterThan(0);
            files.forEach((file) => {
                let fileContent = fs.readFileSync(`${folderPath}/${file}`, 'utf8');
                let isJson = false;
                try {
                    JSON.parse(fileContent);
                    isJson = true;
                } catch (error) {
                    isJson = false;
                }
                expect(isJson, `${file} should be a valid JSON`).to.be.true;
            });
            let firstFileContent = fs.readFileSync(`${folderPath}/${files[0]}`, 'utf8');
            let parsedData;
            parsedData = JSON.parse(firstFileContent);
            expect(parsedData).to.have.property('name');
            rimraf.sync(folderPath);
            fs.mkdirSync(folderPath);
        }).timeout(1000 * 60 * 6);

        it('export algorithms as YAMLs to a local directory', async () => {
            const rimraf = require('rimraf');
            const yaml = require('js-yaml');
            const folderPath = './additionalFiles/exportedAlgorithms';
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath);
            }
            const exportAlgoCommand = "hkubectl export algorithms -f yaml ./additionalFiles/exportedAlgorithms";
            const exportAlgorithms = await execSync(exportAlgoCommand);
            let files = fs.readdirSync(folderPath, 'utf8');
            expect(files.length).to.be.greaterThan(0);

            files.forEach((file) => {
                let fileContent = fs.readFileSync(`${folderPath}/${file}`, 'utf8');
                try {
                    yaml.safeLoad(fileContent);
                    isYaml = true;
                } catch (error) {
                    isYaml = false;
                }
                expect(isYaml, `${file} should be a valid YAML`).to.be.true;
            });
            if (files.length > 0) {
                let firstFileContent = fs.readFileSync(`${folderPath}/${files[0]}`, 'utf8');
                let parsedData;
                parsedData = yaml.safeLoad(firstFileContent);
                expect(parsedData).to.have.property('name');
            }
            rimraf.sync(folderPath);
            fs.mkdirSync(folderPath);
        }).timeout(1000 * 60 * 10);

        it('export with a non-existing directory', () => {
            const { spawnSync } = require('child_process');
            const nonExistingDir = './additionalFiles/nonExistingDir';
            expect(fs.existsSync(nonExistingDir), `Directory "${nonExistingDir}" should not exist`).to.be.false;

            const exportAlgoCommand = 'hkubectl';
            const args = ['export', 'algorithms', nonExistingDir];
            const args2 = ['export', 'pipelines', nonExistingDir];
            const args3 = ['export', 'all', nonExistingDir];

            console.log('Running command:', exportAlgoCommand, args.join(' '));

            const result = spawnSync(exportAlgoCommand, args, { encoding: 'utf-8' });
            const result2 = spawnSync(exportAlgoCommand, args2, { encoding: 'utf-8' });
            const result3 = spawnSync(exportAlgoCommand, args3, { encoding: 'utf-8' });

            expect(result.stderr).to.include(`Directory "./additionalFiles/nonExistingDir" does not exist.`);
            expect(result2.stderr).to.include(`Directory "./additionalFiles/nonExistingDir" does not exist.`);
            expect(result3.stderr).to.include(`Directory "./additionalFiles/nonExistingDir" does not exist.`);
        }).timeout(1000 * 60 * 10);

        it('export pipelines as jsons to a local directory', async () => {
            const rimraf = require('rimraf');
            const folderPath = './additionalFiles/exportedPipelines';
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath);
            }
            const exportPipelineCommand = `hkubectl export pipelines ${folderPath}`;
            const exportedPipelines = await execSync(exportPipelineCommand, { encoding: 'utf-8' });
            let files = fs.readdirSync(folderPath, 'utf8');
            expect(files.length).to.be.greaterThan(0, 'No files found in the directory');
            expect(exportedPipelines).to.include("Saved");
            files.forEach((file) => {
                let fileContent = fs.readFileSync(`${folderPath}/${file}`, 'utf8');
                let isJson = false;

                try {
                    JSON.parse(fileContent);
                    isJson = true;
                } catch (error) {
                    isJson = false;
                }

                expect(isJson, `${file} should be a valid JSON`).to.be.true;
            });
            let firstFileContent = fs.readFileSync(`${folderPath}/${files[0]}`, 'utf8');
            let parsedData;
            parsedData = JSON.parse(firstFileContent);
            expect(parsedData).to.have.property('nodes');
            rimraf.sync(folderPath);
            fs.mkdirSync(folderPath);
        }).timeout(1000 * 60 * 6);

        it('export pipelines as YAMLs to a local directory', async () => {
            const rimraf = require('rimraf');
            const yaml = require('js-yaml');
            const folderPath = './additionalFiles/exportedPipelines';
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath);
            }
            const exportPipelineCommand = `hkubectl export pipelines -f yaml ${folderPath}`;
            const exportedPipelines = await execSync(exportPipelineCommand, { encoding: 'utf-8' });
            let files = fs.readdirSync(folderPath, 'utf8');
            expect(files.length).to.be.greaterThan(0, 'No files found in the directory');
            expect(exportedPipelines).to.include("Saved");
            files.forEach((file) => {
                let fileContent = fs.readFileSync(`${folderPath}/${file}`, 'utf8');
                try {
                    yaml.safeLoad(fileContent);
                    isYaml = true;
                } catch (error) {
                    isYaml = false;
                }
                expect(isYaml, `${file} should be a valid YAML`).to.be.true;
            });
            if (files.length > 0) {
                let firstFileContent = fs.readFileSync(`${folderPath}/${files[0]}`, 'utf8');
                let parsedData;
                parsedData = yaml.safeLoad(firstFileContent);
                expect(parsedData).to.have.property('nodes');
                rimraf.sync(folderPath);
                fs.mkdirSync(folderPath);
            }
        }).timeout(1000 * 60 * 6);

        it('export all data as jsons to a local directory', async () => {
            const rimraf = require('rimraf');
            const baseFolderPath = './additionalFiles/allData';
            if (!fs.existsSync(baseFolderPath)) {
                fs.mkdirSync(baseFolderPath);
            }
            const exportDataCommand = `hkubectl export all ${baseFolderPath}`;
            await execSync(exportDataCommand, { encoding: 'utf-8' });
            let files = fs.readdirSync(baseFolderPath, 'utf8');
            expect(files.length).to.equal(2, 'two folders, pipelines and algorithms');

            files.forEach((folder) => {
                let folderPath = `${baseFolderPath}/${folder}`;
                let subFiles = fs.readdirSync(folderPath, 'utf8');

                subFiles.forEach((file) => {
                    let fileContent = fs.readFileSync(`${folderPath}/${file}`, 'utf8');

                    if (folder === 'algorithms') {
                        try {
                            let parsedData = JSON.parse(fileContent);
                            expect(parsedData).to.have.property('name');
                        } catch (error) {
                            console.error(`Error parsing JSON for algorithm ${file}: ${error}`);
                            expect.fail(`Failed to parse JSON for algorithm ${file}`);
                        }
                    } else if (folder === 'pipelines') {
                        try {
                            let parsedData = JSON.parse(fileContent);
                            expect(parsedData).to.have.property('nodes');
                        } catch (error) {
                            console.error(`Error parsing JSON for pipeline ${file}: ${error}`);
                            expect.fail(`Failed to parse JSON for pipeline ${file}`);
                        }
                    } else {
                        console.error(`Unexpected folder: ${folder}`);
                        expect.fail(`Unexpected folder: ${folder}`);
                    }
                });
            });

            rimraf.sync(baseFolderPath);
            fs.mkdirSync(baseFolderPath);
        }).timeout(1000 * 60 * 6);
    });

    describe('hkubecl import tests', () => {
        it('import algoritms from a local directory to hkube env', async () => {
            await deleteAlgorithm('6o5yjjiy', dev_token);
            await deleteAlgorithm('7i59t2ad', dev_token);
            algList.push('6o5yjjiy');
            algList.push('7i59t2ad');
            const folderPath = './additionalFiles/importAlgorithms';
            const importAlgoCommand = `hkubectl import algorithms ${folderPath}`;
            const importedAlgorithms = await execSync(importAlgoCommand);
            expect(importedAlgorithms.toString()).to.include("Successfully imported 6o5yjjiy");
            expect(importedAlgorithms.toString()).to.include("Successfully imported 7i59t2ad");
        }).timeout(1000 * 60 * 6);

        it('import algoritms from a local directory to hkube env, switch cpu from 1 to 2', async () => {
            await deleteAlgorithm('6o5yjjiy', dev_token);
            await deleteAlgorithm('7i59t2ad', dev_token);
            algList.push('6o5yjjiy');
            algList.push('7i59t2ad');
            const folderPath = './additionalFiles/importAlgorithms';
            const importAlgoCommand = `hkubectl import algorithms ${folderPath} -r \"\\"cpu\\": 1^\\"cpu\\": 2\"`;
            const importedAlgorithms = await execSync(importAlgoCommand);
            alg2 = await getAlgorithm('7i59t2ad', dev_token);
            expect(importedAlgorithms.toString()).to.include('1 occurrences of ""cpu": 1" found and changed');
            expect(importedAlgorithms.toString()).to.include("Successfully imported 6o5yjjiy");
            expect(importedAlgorithms.toString()).to.include("Successfully imported 7i59t2ad");
            expect(alg2.body.cpu).to.be.equal(2);
        }).timeout(1000 * 60 * 6);

        it('import algoritms from a local directory to hkube env. use ; decorator to change 2 values', async () => {
            await deleteAlgorithm('6o5yjjiy', dev_token);
            await deleteAlgorithm('7i59t2ad', dev_token);
            algList.push('6o5yjjiy');
            algList.push('7i59t2ad');
            const folderPath = './additionalFiles/importAlgorithms';
            const importAlgoCommand = `hkubectl import algorithms ${folderPath} -r \"\\"cpu\\": 1^\\"cpu\\": 2\"";"52Mi\"^\"60Mi\""`;
            const importedAlgorithms = await execSync(importAlgoCommand);
            alg2 = await getAlgorithm('7i59t2ad', dev_token);
            expect(importedAlgorithms.toString()).to.include('1 occurrences of ""cpu": 1" found and changed');
            expect(importedAlgorithms.toString()).to.include('1 occurrences of "52Mi" found and changed');
            expect(importedAlgorithms.toString()).to.include("Successfully imported 6o5yjjiy");
            expect(importedAlgorithms.toString()).to.include("Successfully imported 7i59t2ad");
            expect(alg2.body.cpu).to.be.equal(2);
            expect(alg2.body.reservedMemory).to.be.equal('60Mi');
        }).timeout(1000 * 60 * 6);

        it('import pipelines from a local directory to hkube env', async () => {
            await deletePipeline('0aIWYOaR', dev_token);
            await deletePipeline('0lAzCLWk', dev_token);
            pipeList.push('0aIWYOaR');
            pipeList.push('0lAzCLWk');
            const folderPath = './additionalFiles/importPipelines';
            const importPipeCommand = `hkubectl import pipelines ${folderPath}`;
            const importedPipelines = await execSync(importPipeCommand);
            expect(importedPipelines.toString()).to.include("Successfully imported 0aIWYOaR");
            expect(importedPipelines.toString()).to.include("Successfully imported 0lAzCLWk");
        }).timeout(1000 * 60 * 6);

        it('import all data from a local directory to hkube env', async () => {
            await deletePipeline('0aIWYOaR', dev_token);
            await deletePipeline('0lAzCLWk', dev_token);
            await deleteAlgorithm('6o5yjjiy', dev_token);
            await deleteAlgorithm('7i59t2ad', dev_token);
            pipeList.push('0aIWYOaR');
            pipeList.push('0lAzCLWk');
            algList.push('6o5yjjiy');
            algList.push('7i59t2ad');
            const folderPath = './additionalFiles/importAllData';
            const importAllCommand = `hkubectl import all ${folderPath}`;
            const importedAllFiles = await execSync(importAllCommand);
            expect(importedAllFiles.toString()).to.include("Successfully imported 0aIWYOaR");
            expect(importedAllFiles.toString()).to.include("Successfully imported 0lAzCLWk");
            expect(importedAllFiles.toString()).to.include("Successfully imported 6o5yjjiy");
            expect(importedAllFiles.toString()).to.include("Successfully imported 7i59t2ad");
        }).timeout(1000 * 60 * 6);

        it('import existing pipeline using overwrite', async () => {
            await deletePipeline('0aIWYOaR', dev_token);
            await deletePipeline('0lAzCLWk', dev_token);
            await deleteAlgorithm('6o5yjjiy', dev_token);
            await deleteAlgorithm('7i59t2ad', dev_token);
            pipeList.push('0aIWYOaR');
            pipeList.push('0lAzCLWk');
            algList.push('6o5yjjiy');
            algList.push('7i59t2ad');
            const pipelineFile = './pipelines/simpelraw.json';
            const pipelineTemp = './pipelines/temp.json';
            filePathList.push(pipelineTemp);
            let fileContents = fs.readFileSync(pipelineFile, 'utf8');
            let data = JSON.parse(fileContents);
            data.name = "0aIWYOaR";
            let jsonStr = JSON.stringify(data);
            fs.writeFileSync(pipelineTemp, jsonStr, 'utf8');
            const store = `hkubectl pipeline store -f ` + pipelineTemp;
            await exceSyncString(store);
            const pipe = await getPipeline(data.name, dev_token);
            expect(pipe.body.name).to.be.equal(data.name);
            const folderPath = './additionalFiles/importAllData';
            const importAllCommand = `hkubectl import all --overwrite=true ${folderPath}`;
            const importedAllFiles = await execSync(importAllCommand);
            expect(importedAllFiles.toString()).to.include("Successfully imported 0aIWYOaR");
            expect(importedAllFiles.toString()).to.include("Successfully imported 0lAzCLWk");
            expect(importedAllFiles.toString()).to.include("Successfully imported 6o5yjjiy");
            expect(importedAllFiles.toString()).to.include("Successfully imported 7i59t2ad");
        }).timeout(1000 * 60 * 6);

        it('import existing pipeline', async () => {
            await deletePipeline('0aIWYOaR', dev_token);
            await deletePipeline('0lAzCLWk', dev_token);
            await deleteAlgorithm('6o5yjjiy', dev_token);
            await deleteAlgorithm('7i59t2ad', dev_token);
            pipeList.push('0aIWYOaR');
            pipeList.push('0lAzCLWk');
            algList.push('6o5yjjiy');
            algList.push('7i59t2ad');
            const pipelineFile = './pipelines/simpelraw.json';
            const pipelineTemp = './pipelines/temp.json';
            filePathList.push(pipelineTemp);
            let fileContents = fs.readFileSync(pipelineFile, 'utf8');
            let data = JSON.parse(fileContents);
            data.name = "0aIWYOaR";
            let jsonStr = JSON.stringify(data);
            fs.writeFileSync(pipelineTemp, jsonStr, 'utf8');
            const store = `hkubectl pipeline store -f ` + pipelineTemp;
            const output = await exceSyncString(store);
            const pipe = await getPipeline(data.name, dev_token);
            expect(pipe.body.name).to.be.equal(data.name);
            const folderPath = './additionalFiles/importAllData';
            const importAllCommand = `hkubectl import all  ${folderPath}`;
            const importedAllFiles = await execSync(importAllCommand);
            expect(importedAllFiles.toString()).not.to.include("Successfully imported 0aIWYOaR");
            expect(importedAllFiles.toString()).to.include("Successfully imported 0lAzCLWk");
            expect(importedAllFiles.toString()).to.include("Successfully imported 6o5yjjiy");
            expect(importedAllFiles.toString()).to.include("Successfully imported 7i59t2ad");
        }).timeout(1000 * 60 * 6);

        it('import all data from a local directory to hkube env. change one param in an algo', async () => {
            await deletePipeline('0aIWYOaR', dev_token);
            await deletePipeline('0lAzCLWk', dev_token);
            await deleteAlgorithm('6o5yjjiy', dev_token);
            await deleteAlgorithm('7i59t2ad', dev_token);
            pipeList.push('0aIWYOaR');
            pipeList.push('0lAzCLWk');
            algList.push('6o5yjjiy');
            algList.push('7i59t2ad');
            const folderPath = './additionalFiles/importAllData';
            const importAllCommand = `hkubectl import all ${folderPath} -r \"\\"cpu\\": 1^\\"cpu\\": 2\"`;
            const importedAllFiles = await execSync(importAllCommand);
            expect(importedAllFiles.toString()).to.include('1 occurrences of ""cpu": 1" found and changed');
            expect(importedAllFiles.toString()).to.include("Successfully imported 0aIWYOaR");
            expect(importedAllFiles.toString()).to.include("Successfully imported 0lAzCLWk");
            expect(importedAllFiles.toString()).to.include("Successfully imported 6o5yjjiy");
            expect(importedAllFiles.toString()).to.include("Successfully imported 7i59t2ad");
        }).timeout(1000 * 60 * 6);

        it('import all data from a local directory to hkube env. use ; decorator to change 2 values', async () => {
            await deletePipeline('0aIWYOaR', dev_token);
            await deletePipeline('0lAzCLWk', dev_token);
            await deleteAlgorithm('6o5yjjiy', dev_token);
            await deleteAlgorithm('7i59t2ad', dev_token);
            pipeList.push('0aIWYOaR');
            pipeList.push('0lAzCLWk');
            algList.push('6o5yjjiy');
            algList.push('7i59t2ad');
            const folderPath = './additionalFiles/importAllData';
            const importAllCommand = `hkubectl import all ${folderPath} -r \"\\"cpu\\": 1^\\"cpu\\": 2\"";"52Mi\"^\"60Mi\""`;
            const importedAllFiles = await execSync(importAllCommand);
            expect(importedAllFiles.toString()).to.include('1 occurrences of ""cpu": 1" found and changed');
            expect(importedAllFiles.toString()).to.include('1 occurrences of "52Mi" found and changed');
            expect(importedAllFiles.toString()).to.include("Successfully imported 0aIWYOaR");
            expect(importedAllFiles.toString()).to.include("Successfully imported 0lAzCLWk");
            expect(importedAllFiles.toString()).to.include("Successfully imported 6o5yjjiy");
            expect(importedAllFiles.toString()).to.include("Successfully imported 7i59t2ad");
        }).timeout(1000 * 60 * 6);

        it('import using a non-existing directory', () => {
            const { spawnSync } = require('child_process');
            const nonExistingDir = './additionalFiles/nonExistingDir';
            expect(fs.existsSync(nonExistingDir), `Directory "${nonExistingDir}" should not exist`).to.be.false;

            const importAlgoCommand = 'hkubectl';
            const args = ['import', 'algorithms', nonExistingDir];
            const args2 = ['import', 'pipelines', nonExistingDir];
            const args3 = ['import', 'all', nonExistingDir];
            console.log('Running command:', importAlgoCommand, args.join(' '));
            const result = spawnSync(importAlgoCommand, args, { encoding: 'utf-8' });
            const result2 = spawnSync(importAlgoCommand, args2, { encoding: 'utf-8' });
            const result3 = spawnSync(importAlgoCommand, args3, { encoding: 'utf-8' });

            console.log(result3.stderr);
            expect(result.stderr).to.include(`Directory "./additionalFiles/nonExistingDir" does not exist.`);
            expect(result2.stderr).to.include(`Directory "./additionalFiles/nonExistingDir" does not exist.`);
            expect(result3.stderr).to.include(`Directory "additionalFiles/nonExistingDir/pipelines" does not exist.`);
            expect(result3.stderr).to.include(`Directory "additionalFiles/nonExistingDir/algorithms" does not exist.`);
        }).timeout(1000 * 60 * 10);
    });
});