const chai = require('chai');
const path = require('path');
const chaiHttp = require('chai-http');
const config = require(path.join(process.cwd(), 'config/config'));
const delay = require('delay')
const expect = chai.expect;
const assertArrays = require('chai-arrays');


const execSync = require('child_process').execSync;
const {
    pipelineRandomName,
    getPipeline,
    deletePipeline
} = require('../utils/pipelineUtils')

const {
    getJobIdStatus,
    getResult,
    getStatusall } = require('../utils/results')


const {
    runAlgGetResult,
    getAlgorithm,
    storeAlgorithmApply,
    deleteAlgorithm,
    getBuildList } = require('../utils/algorithmUtils')

chai.use(chaiHttp);
chai.use(assertArrays);
const yaml = require('js-yaml');

const exceSyncString = async (command) => {
    console.log("start- " + command)
    output = execSync(command);
    const noColor = output.toString('utf8').replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
    console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
    console.log(noColor)
    console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
    return noColor

}

const execSyncReturenJSON = async (command) => {

    const noColor = await exceSyncString(command)
    const obj = yaml.load(noColor)
    const result = JSON.stringify(obj, null, 2)

    const jsonResult = JSON.parse(result)

    console.log("execSyncReturenJSON return typeof jsonResult = " + typeof jsonResult)
    return jsonResult
}


describe('Hkubectl Tests', () => {
    let algList = []

    after(async function () {
        this.timeout(2 * 60 * 1000);
        console.log("sater after")
        console.log("algList = " + algList)
        j = 0
        z = 3

        while (j < algList.length) {
            delAlg = algList.slice(j, z)
            const del = delAlg.map((e) => {
                return deleteAlgorithm(e)
            })
            console.log("delAlg-" + delAlg)
            const delResult = await Promise.all(del)
            console.log("delResult-" + delResult)
            await delay(2000)
            j += 3
            z += 3
            console.log("j=" + j + ",z=" + z)
        }


        console.log("end -----")

    })
    describe('hkubecl algorithm tests', () => {
        it('hkube algorithm list', async () => {
            const runSimple = "hkubectl algorithm list --json"

            const jsonResult = await execSyncReturenJSON(runSimple);
            console.log(jsonResult)
            console.log("jsonResult.length-" + jsonResult.length)
            expect(jsonResult.length).to.be.above(6)

        }).timeout(1000 * 60 * 6)



        it('hkube algorithm get', async () => {
            const runSimple = "hkubectl algorithm get green-alg --json"
            const jsonResult = await execSyncReturenJSON(runSimple);
            console.log(jsonResult)

            expect(jsonResult.name).to.be.equal('green-alg')

        }).timeout(1000 * 60 * 6)

        xit('hkube algorithm apply', async () => {
            const algName = pipelineRandomName(8).toLowerCase()
            algList.push(algName)
            const filePath = path.join(process.cwd(), 'additionalFiles/python.versions.tar.gz');
            const runBulid = `hkubectl algorithm apply ${algName} ` +
                `--env python ` +
                `--codeEntryPoint main35 ` +
                `--gpu 0 ` +
                `--cpu 1 ` +
                `--mem 256Mi ` +
                `--codePath ${filePath} `

            const buildResult = await exceSyncString(runBulid);

            const result = await runAlgGetResult(algName, [4])
            await deleteAlgorithm(algName, true)
            expect(result.data[0].result.version.toString()).to.be.equal("3.5")

        }).timeout(1000 * 60 * 6)

        xit('hkube algorithm apply from file and delete', async () => {
            const fs = require('fs');
            const algName = pipelineRandomName(8).toLowerCase()
            algList.push(algName)
            const algFile = path.join(process.cwd(), './additionalFiles/alg.yaml');
            let fileContents = fs.readFileSync(algFile, 'utf8');
            let data = yaml.safeLoad(fileContents);
            data.name = `${algName}`
            let yamlStr = yaml.safeDump(data);
            fs.writeFileSync(algFile, yamlStr, 'utf8');

            const runBulid = `hkubectl algorithm apply ` +
                `-f ${algFile}`
            const buildResult = await exceSyncString(runBulid);
            delay(5000)
            const result = await runAlgGetResult(algName, [4])

            expect(result.data[0].result.version.toString()).to.be.equal("3.5")

            const deleteAlg = `hkubectl algorithm delete ${algName}`
            const deleteResult = await exceSyncString(deleteAlg);

            const alg = await getAlgorithm(algName)
            console.log(alg.body)
            expect(alg.status).to.be.equal(404)
        }).timeout(1000 * 60 * 10)





        it('hkube algorithm apply alg version', async () => {
            const algName = pipelineRandomName(8).toLowerCase()
            algList.push(algName)
            let trgzFile = 'version1.tar.gz'
            let runBulid = `hkubectl algorithm apply ${algName} ` +
                `--env python ` +
                `--codeEntryPoint main ` +
                `--gpu 0 ` +
                `--cpu 1 ` +
                `--mem 256Mi ` +
                `--codePath ./additionalFiles/${trgzFile} `
            trgzFile2 = 'version2.tar.gz'
            let runBulidV2 = `hkubectl algorithm apply ${algName} ` +
                `--env python ` +
                `--codeEntryPoint mainv1 ` +
                `--gpu 0 ` +
                `--cpu 1 ` +
                `--mem 256Mi ` +
                `--codePath ./additionalFiles/${trgzFile2} `
            console.log("start build 1")
            const buildResult = await exceSyncString(runBulid);
            console.log("start build 2")
            const buildResult2 = await exceSyncString(runBulidV2);
            const result = await runAlgGetResult(algName, [4])
            expect(result.data[0].result.version.toString()).to.be.equal("1.1")
        }).timeout(1000 * 60 * 15)

        it('hkube algorithm apply alg version setCurrent', async () => {
            const algName = pipelineRandomName(8).toLowerCase()
            algList.push(algName)
            let trgzFile = 'version1.tar.gz'
            let runBulid = `hkubectl algorithm apply ${algName} ` +
                `--env python ` +
                `--codeEntryPoint main ` +
                `--gpu 0 ` +
                `--cpu 1 ` +
                `--mem 256Mi ` +
                `--codePath ./additionalFiles/${trgzFile} `
            trgzFile2 = 'version2.tar.gz'
            let runBulidV2 = `hkubectl algorithm apply ${algName} ` +
                `--env python ` +
                `--codeEntryPoint mainv1 ` +
                `--gpu 0 ` +
                `--cpu 1 ` +
                `--mem 256Mi ` +
                `--setCurrent true ` +
                `--codePath ./additionalFiles/${trgzFile2} `
            console.log("start build 1")
            const buildResult = await exceSyncString(runBulid);

            console.log("start build 2")
            const buildResult2 = await exceSyncString(runBulidV2);

            const result = await runAlgGetResult(algName, [4])

            expect(result.data[0].result.version.toString()).to.be.equal("1.1")
        }).timeout(1000 * 60 * 10)

        it('hkube algorithm apply nowait', async () => {
            const algName = pipelineRandomName(8).toLowerCase()
            algList.push(algName)
            const runBulid = `hkubectl algorithm apply ${algName} ` +
                `--env python ` +
                `--codeEntryPoint main35 ` +
                `--gpu 0 ` +
                `--cpu 1 ` +
                `--mem 256Mi ` +
                `--codePath ./additionalFiles/python.versions.tar.gz ` +
                `--noWait`

            const buildResult = await exceSyncString(runBulid);

            const builds = await getBuildList(algName)
            console.log(builds)
            const buildStatusAlg = await getStatusall(builds[0].buildId, `/builds/status/`, 200, "completed", 1000 * 60 * 10)
            const result = await runAlgGetResult(algName, [4])
            await deleteAlgorithm(algName, true)
            expect(result.data[0].result.version.toString()).to.be.equal("3.5")

        }).timeout(1000 * 60 * 6)




    })
    describe('hkubecl pipeline tests', () => {

        it('pipeline get', async () => {

            const get = "hkubectl pipeline get simple  --json"
            const output = await exceSyncString(get);

            //  const expected = ["name","simple"]
            const result = JSON.parse(output)

            expect(result.result.name).to.be.equal('simple')
        }).timeout(1000 * 60 * 6)

        it('pipeline store from file', async () => {
            const fs = require('fs');
            const pipelineName = pipelineRandomName(8).toLowerCase()
            const pipelineFile = './pipelines/simpelraw.json'
            const pipelineTemp = './pipelines/temp.json'
            let fileContents = fs.readFileSync(pipelineFile, 'utf8');
            let data = JSON.parse(fileContents);
            data.name = `${pipelineName}`
            let jsonStr = JSON.stringify(data);
            fs.writeFileSync(pipelineTemp, jsonStr, 'utf8');
            const store = `hkubectl pipeline store -f ` + pipelineTemp
            const output = await exceSyncString(store);

            const pipe = await getPipeline(pipelineName)
            expect(pipe.body.name).to.be.equal(pipelineName)
            await deletePipeline(pipelineName)
        }).timeout(1000 * 60 * 6)
    })
    describe('hkubecl exec tests', () => {

        it('exec stored pipe wait', async () => {

            console.log("start")
            const runSimple = "hkubectl exec stored simple "

            const jsonResult = await execSyncReturenJSON(runSimple);
            expect(jsonResult.jobResult[0].result).to.be.equal('links-1')
        }).timeout(1000 * 60 * 6)


        it('exec stored pipe noWait', async () => {
            const runSimple = "hkubectl exec stored simple --noWait"

            const jsonResult = await execSyncReturenJSON(runSimple)

            console.log(jsonResult)
            const result = await getResult(jsonResult.jobId, 200)
            console.log(result)
            expect(result.data[0].result).to.be.equal('links-1')
        }).timeout(1000 * 60 * 6)

        it('exec raw pipe ', async () => {
            const runSimple = "hkubectl exec raw -f ./pipelines/simpelraw.json"
            //const jsonResult = await execSyncReturenJSON(runSimple)
            const output = await execSync(runSimple + " --json");

            const jsonResult = output.toString('utf8')
            console.log(jsonResult)
            const js = JSON.parse(jsonResult)
            console.log("jobId =" + js.jobId)
            const result = await getResult(js.jobId, 200)
            console.log(result)
            expect(result.data[0].result).to.be.equal('links-1')
        }).timeout(1000 * 60 * 6)


        it('exec  algorithm wait', async () => {

            console.log("start")
            const runSimple = "hkubectl exec algorithm green-alg "

            const jsonResult = await execSyncReturenJSON(runSimple);
            console.log(jsonResult)
            expect(jsonResult.jobResult[0].nodeName).to.be.equal('green-alg')
        }).timeout(1000 * 60 * 6)


        it('exec  algorithm noWait', async () => {
            const runSimple = "hkubectl exec algorithm green-alg --noWait"
            const jsonResult = await execSyncReturenJSON(runSimple)

            console.log(jsonResult)
            const result = await getResult(jsonResult.jobId, 200)
            console.log(result)
            expect(result.data[0].result).to.be.equal(null)
        }).timeout(1000 * 60 * 6)

        it('exec stop pipe ', async () => {
            const runSimple = "hkubectl exec stored simple --noWait"
            const jsonResult = await execSyncReturenJSON(runSimple)

            console.log(jsonResult)

            const stop = `hkubectl exec stop ${jsonResult.jobId} "stop by test"`

            const stopResult = await execSyncReturenJSON(stop)
            console.log(stopResult)
            const result = await getResult(jsonResult.jobId, 200)
            console.log(result)
            expect(result.status).to.be.equal("stopped")
        }).timeout(1000 * 60 * 6)


        it('exec status pipe ', async () => {
            const runSimple = "hkubectl exec stored simple --noWait"
            const jsonResult = await execSyncReturenJSON(runSimple)
            console.log("=======================")
            console.log(jsonResult)
            console.log("=======================")
            const status = `hkubectl exec status ${jsonResult.jobId}`
            const array = []
            array.push(execSyncReturenJSON(status))
            array.push(getJobIdStatus(jsonResult.jobId))
            const statuses = await Promise.all(array)
            expect(statuses[0].result.status).to.be.equal(statuses[1].body.status)

        }).timeout(1000 * 60 * 6)

        it('exec get pipe ', async () => {

            const get = "hkubectl pipeline get simple --json"
            //const output = await exceSyncString(get);
            //const expected = ["name","simple"]
            //const result = output.split("\n")

            //expect(expected.filter(a=>result[1].includes(a)).length).to.be.equal(2)
            const output = await exceSyncString(get);

            //  const expected = ["name","simple"]
            const result = JSON.parse(output)

            expect(result.result.name).to.be.equal('simple')
        }).timeout(1000 * 60 * 6)

        it('exec results pipe ', async () => {
            const runSimple = "hkubectl exec stored simple --noWait"
            const jsonResult = await execSyncReturenJSON(runSimple)
            console.log(jsonResult)
            const result = await getResult(jsonResult.jobId, 200)
            console.log(result)


            const cti = " hkubectl exec result --jobId = " + jsonResult.jobId

            const output = await exceSyncString(cti);

            //const ctlResult = await execSyncReturenJSON(cti)

            console.log(result)

            expect(output.replace(/^\s+|\s+$/gm, '').trim()).to.contain("result:        links-1")
        }).timeout(1000 * 60 * 6)

    });

    describe('sync test', () => {

        const delay = require('delay')
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
            const algName = pipelineRandomName(8).toLowerCase()
            algList.push(algName)
            const folderPath = path.join(process.cwd(), algName)
            var fs = require('fs');

            if (!fs.existsSync(algName)) {
                fs.mkdirSync(algName);
            }

            var data = fs.readFileSync(filePath, 'utf8');
            fs.writeFileSync(`${folderPath}/main.py`, data, { encoding: 'utf8', flag: 'w' })

            const command = ` hkubectl sync create` +
                ` --entryPoint main.py` +
                ` --algorithmName ${algName}` +
                ` --folder ${folderPath}` +
                ` --env python`
            console.log(command)
            console.log("2")
            await exceSyncString(command)
            console.log("3")
            const watch = `hkubectl sync watch` +
                ` -a ${algName}` +
                ` -f ${folderPath}`

            execShellCommand(watch)
            console.log("4")
            await delay(20 * 1000)
            console.log("5")
            const result = await runAlgGetResult(algName, [4])

            //  await deleteAlgorithm(algName,true)    
            expect(result.data[0].result.version.toString()).to.be.equal("1")

            const newmain = data.replace(`"version":"1"`, `"version":"2"`)
            console.log("6")
            fs.writeFileSync(`${folderPath}/main.py`, newmain, { encoding: 'utf8', flag: 'w' })
            console.log("7")
            await delay(20 * 1000)

            const result2 = await runAlgGetResult(algName, [4])
            await deleteAlgorithm(algName, true)
            expect(result2.data[0].result.version.toString()).to.be.equal("2")

        }).timeout(1000 * 60 * 10)


        it('sync python alg with requirements', async () => {
            const folderPath = path.join(process.cwd(), 'additionalFiles/pythonAlg');
            const algName = pipelineRandomName(8).toLowerCase()
            algList.push(algName)
            console.log("alg-name-" + algName)
            var fs = require('fs');

            const command = ` hkubectl sync create` +
                ` --entryPoint ${algName}.py` +
                ` --algorithmName ${algName}` +
                ` --folder ${folderPath}` +
                ` --env python`

            console.log(command)
            await exceSyncString(command)
            const watch = `hkubectl sync watch` +
                ` -a ${algName}` +
                ` -f ${folderPath}`
            console.log("watch-" + watch)
            execShellCommand(watch)
            var filePath = `${folderPath}/main.py`

            var data = fs.readFileSync(filePath, 'utf8');
            fs.writeFileSync(`${folderPath}/${algName}.py`, data, { encoding: 'utf8', flag: 'w' })

            await delay(40 * 1000)

            const result = await runAlgGetResult(algName, [4])
            console.log(result)
            deleteAlgorithm(algName)
        }).timeout(1000 * 60 * 10)



        it('sync python alg ignor files', async () => {
            //the folder containg hkubeignore that has one line to ignore *.txt
            const folderPath = path.join(process.cwd(), 'additionalFiles/pythonIgnoreFile');

            const algName = pipelineRandomName(8).toLowerCase()
            algList.push(algName)
            console.log("alg-name-" + algName)
            var fs = require('fs');

            const command = ` hkubectl sync create` +
                ` --entryPoint ${algName}.py` +
                ` --algorithmName ${algName}` +
                ` --folder ${folderPath}` +
                ` --env python`

            console.log(command)
            await exceSyncString(command)
            const watch = `hkubectl sync watch` +
                ` -a ${algName}` +
                ` -f ${folderPath}`
            console.log("watch-" + watch)
            execShellCommand(watch)
            var filePath = `${folderPath}/main.py`

            var data = fs.readFileSync(filePath, 'utf8');
            fs.writeFileSync(`${folderPath}/${algName}.py`, data, { encoding: 'utf8', flag: 'w' })

            await delay(20 * 1000)

            const result = await runAlgGetResult(algName, [4])
            console.log(result)
            //when running from local there are 6 txt file
            expect(result.data[0].result).to.be.equal(6)

            const alg = await getAlgorithm(algName)
            const image = alg.body.algorithmImage


            const newName = algName + "-new"
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
                }

            }

            const res = await storeAlgorithmApply(alg1);
            algList.push(newName)
            const result1 = await runAlgGetResult(newName, [4])
            console.log(result)
            expect(result1.data[0].result).to.be.equal(0)

        }).timeout(1000 * 60 * 10)

    describe('hkubecl export tests', () => {
        it('export algoritms as jsons to a local directory ', async () => {
            const fs = require('fs');
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
        }).timeout(1000 * 60 * 6)

        it('export algorithms as YAMLs to a local directory', async () => {
            const fs = require('fs');
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
            const fs = require('fs');
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
            const fs = require('fs');
            const rimraf = require('rimraf');
            const folderPath = './additionalFiles/exportedPipelines';
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath);
            }
            const exportPipelineCommand = `hkubectl export pipelines ${folderPath}`;
            const exportedPipelines = await execSync(exportPipelineCommand, { encoding: 'utf-8' });
            let files = fs.readdirSync(folderPath, 'utf8');
            expect(files.length).to.be.greaterThan(0, 'No files found in the directory');
            expect(exportedPipelines).to.include("Saved")
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
            const fs = require('fs');
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
            expect(exportedPipelines).to.include("Saved")
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
            const fs = require('fs');
            const rimraf = require('rimraf');
            const baseFolderPath = './additionalFiles/allData';
            if (!fs.existsSync(baseFolderPath)) {
                fs.mkdirSync(baseFolderPath);
            }
            const exportDataCommand = `hkubectl export all ${baseFolderPath}`;
            const exportedData = await execSync(exportDataCommand, { encoding: 'utf-8' });
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
    })
});
})




