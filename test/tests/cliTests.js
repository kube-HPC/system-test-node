const chai = require('chai');
const path = require('path');
const chaiHttp = require('chai-http');


const expect = chai.expect;
const assertArrays = require('chai-arrays');


const execSync = require('child_process').execSync;
const {
    pipelineRandomName,
    getPipeline,
    deletePipeline,
    getPiplineNodes,
    storePipeline,
    runStored,
    deconstructTestData,
    runStoredAndWaitForResults} = require(path.join(process.cwd(), 'utils/pipelineUtils'))

const { getJobIdStatus,
        getResult,
        getStatusall} = require(path.join(process.cwd(), 'utils/results'))
    

const {runAlgGetResult,
        getAlgorithm, 
        deleteAlgorithm,   
        getBuildList} = require(path.join(process.cwd(), 'utils/algorithmUtils'))

chai.use(chaiHttp);
chai.use(assertArrays);
const fs = require('fs');

const yaml = require('js-yaml');
const exceSyncString = async (command) =>{
    console.log("start- " + command)
    output = execSync(command);
    const noColor = output.toString('utf8').replace( /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');  
    console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")     
    console.log(noColor)
    console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")     
    return noColor

}

const  execSyncReturenJSON = async  (command)=>{
    
    const noColor= await exceSyncString(command)
    const  obj = yaml.load(noColor)
    const result = JSON.stringify(obj, null, 2)
   
    const jsonResult = JSON.parse(result)
  
    console.log("execSyncReturenJSON return typeof jsonResult = " +typeof jsonResult)
    return jsonResult
}

describe('cli test', () => {

    describe('hkubecl algorithm tests', () => { 
        it('hkube algorithm list',async ()=>{
            const runSimple = "hkubectl algorithm list "
            
            const jsonResult = await execSyncReturenJSON(runSimple);
           // console.log(jsonResult)
            console.log("jsonResult.result.length-"+jsonResult.result.length)
            expect(jsonResult.result.length).to.be.above(6)
           
        }).timeout(1000 * 60 * 6)
           
        
        
        it('hkube algorithm get',async ()=>{
            const runSimple = "hkubectl algorithm get green-alg "            
            const jsonResult = await execSyncReturenJSON(runSimple);
            console.log(jsonResult)
           
            expect(jsonResult.result.name).to.be.equal('green-alg')
           
        }).timeout(1000 * 60 * 6)

        it('hkube algorithm apply',async ()=>{
            const algName = pipelineRandomName(8).toLowerCase()
            const filePath = path.join(process.cwd(), 'additionalFiles/python.versions.tar.gz');
            const runBulid = `hkubectl algorithm apply ${algName} `+
                            `--env python `+
                            `--codeEntryPoint main35 `+
                            `--gpu 0 `+
                            `--cpu 1 `+
                            `--mem 256Mi `+
                            `--codePath ${filePath} `
            
            const buildResult = await exceSyncString(runBulid);
           
            const result = await runAlgGetResult(algName,[4])
            await deleteAlgorithm(algName,true)    
            expect(result.data[0].result.version.toString()).to.be.equal("3.5")  
  
        }).timeout(1000 * 60 * 6)

        it('hkube algorithm apply from file and delete',async ()=>{
            const algName = pipelineRandomName(8).toLowerCase()
            const algFile = path.join(process.cwd(),'./additionalFiles/alg.yaml');
            let fileContents = fs.readFileSync(algFile, 'utf8');
            let data = yaml.safeLoad(fileContents);
            data.name = `${algName}`
            let yamlStr = yaml.safeDump(data);
            fs.writeFileSync(algFile, yamlStr, 'utf8');
            const runBulid = `hkubectl algorithm apply `+
                            `-f ${algFile}`            
            const buildResult = await exceSyncString(runBulid);
          
            const result = await runAlgGetResult(algName,[4])
            
            expect(result.data[0].result.version.toString()).to.be.equal("3.5")  
            
            const deleteAlg  = `hkubectl algorithm delete ${algName}`
            const deleteResult = await exceSyncString(deleteAlg);
          
            const alg = await getAlgorithm(algName)
            console.log(alg.body)   
            expect(alg.status).to.be.equal(404)                  
        }).timeout(1000 * 60 * 10)
        
        it.skip('hkube algorithm apply alg version',async ()=>{
            const algName = pipelineRandomName(8).toLowerCase()
            let trgzFile = 'version1.tar.gz'
            let runBulid = `hkubectl algorithm apply ${algName} `+
                            `--env python `+
                            `--codeEntryPoint main `+
                            `--gpu 0 `+
                            `--cpu 1 `+
                            `--mem 256Mi `+
                            `--codePath ./additionalFiles/${trgzFile} `
            trgzFile2 = 'version2.tar.gz'
            let runBulidV2 = `hkubectl algorithm apply ${algName} `+
                            `--env python `+
                            `--codeEntryPoint mainv1 `+
                            `--gpu 0 `+
                            `--cpu 1 `+
                            `--mem 256Mi `+
                            `--codePath ./additionalFiles/${trgzFile2} `
            console.log("start build 1")
            const buildResult = await exceSyncString(runBulid);
         
            console.log("start build 2")
            const buildResult2 = await exceSyncString(runBulidV2);
          
            const result = await runAlgGetResult(algName,[4])
         
            expect(result.data[0].result.version.toString()).to.be.equal("1")  
        //    let setcurrent =  `hkubectl algorithm apply ${algName} `+
        //                     `--env python `+
        //                     `--codeEntryPoint mainv1 `+
        //                     `--gpu 0 `+
        //                     `--cpu 1 `+
        //                     `--mem 256Mi `+
        //                     `--setCurrent true `+
        //                     `--codePath ./additionalFiles/${trgzFile2} `
        //     console.log("start build 3")
        //     const setcurrentResult = await execSync(setcurrent);
        //     console.log(setcurrentResult.toString('utf8'))
        //     const result = await runAlgGetResult(algName,[4])

        }).timeout(1000 * 60 * 10)

        it('hkube algorithm apply alg version setCurrent',async ()=>{
            const algName = pipelineRandomName(8).toLowerCase()
            let trgzFile = 'version1.tar.gz'
            let runBulid = `hkubectl algorithm apply ${algName} `+
                            `--env python `+
                            `--codeEntryPoint main `+
                            `--gpu 0 `+
                            `--cpu 1 `+
                            `--mem 256Mi `+
                            `--codePath ./additionalFiles/${trgzFile} `
            trgzFile2 = 'version2.tar.gz'
            let runBulidV2 = `hkubectl algorithm apply ${algName} `+
                            `--env python `+
                            `--codeEntryPoint mainv1 `+
                            `--gpu 0 `+
                            `--cpu 1 `+
                            `--mem 256Mi `+
                            `--setCurrent true `+
                            `--codePath ./additionalFiles/${trgzFile2} `
            console.log("start build 1")
            const buildResult = await exceSyncString(runBulid);
           
            console.log("start build 2")
            const buildResult2 = await exceSyncString(runBulidV2);
            
            const result = await runAlgGetResult(algName,[4])
         
            expect(result.data[0].result.version.toString()).to.be.equal("1.1")  
        }).timeout(1000 * 60 * 10)

        it('hkube algorithm apply nowait',async ()=>{
            const algName = pipelineRandomName(8).toLowerCase()
            
            const runBulid = `hkubectl algorithm apply ${algName} `+
                            `--env python `+
                            `--codeEntryPoint main35 `+
                            `--gpu 0 `+
                            `--cpu 1 `+
                            `--mem 256Mi `+
                            `--codePath ./additionalFiles/python.versions.tar.gz `+
                            `--noWait`
            
            const buildResult = await exceSyncString(runBulid);
           
            const builds = await getBuildList(algName)
            console.log(builds)
            const buildStatusAlg = await getStatusall(builds[0].buildId, `/builds/status/`, 200, "completed", 1000 * 60 * 10)
            const result = await runAlgGetResult(algName,[4])
            await deleteAlgorithm(algName,true)    
            expect(result.data[0].result.version.toString()).to.be.equal("3.5")    
  
        }).timeout(1000 * 60 * 6)




    })
    describe('hkubecl pipeline tests', () => {

        it('pipeline get',async ()=>{

            const get = "hkubectl pipeline get simple"
            const output = await exceSyncString(get);
            
            expect(output).to.contain("name:      simple")
        }).timeout(1000 * 60 * 6)

        it('pipeline store from file',async ()=>{
            const pipelineName = pipelineRandomName(8).toLowerCase()
            const pipelineFile = './pipelines/simpelraw.json'
            const pipelineTemp = './pipelines/temp.json'
            let fileContents = fs.readFileSync(pipelineFile, 'utf8');
            let data = JSON.parse(fileContents);
            data.name = `${pipelineName}`
            let jsonStr = JSON.stringify(data);
            fs.writeFileSync(pipelineTemp, jsonStr,'utf8');
            const store = `hkubectl pipeline store -f `+ pipelineTemp
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
            expect(jsonResult.jobResult[0].result).to.be.equal(42)
        }).timeout(1000 * 60 * 6)


        it('exec stored pipe noWait', async () => {
            const runSimple = "hkubectl exec stored simple --noWait"
            
            const jsonResult = await execSyncReturenJSON(runSimple)

            console.log(jsonResult)
            const result = await getResult(jsonResult.jobId,200)
            console.log(result)
            expect(result.data[0].result).to.be.equal(42)
        }).timeout(1000 * 60 * 6)

        it('exec raw pipe ', async () => {
            const runSimple = "hkubectl exec raw -f ./pipelines/simpelraw.json"
            const jsonResult = await execSyncReturenJSON(runSimple)

            console.log(jsonResult)
            console.log("jobId ="+ jsonResult.result.jobId)
            const result = await getResult(jsonResult.result.jobId,200)
            console.log(result)
            expect(result.data[0].result).to.be.equal(42)
        }).timeout(1000 * 60 * 6)


        it('exec  algorithm wait', async () => {   
            
            console.log("start")
            const runSimple = "hkubectl exec algorithm green-alg "
            
            const jsonResult = await execSyncReturenJSON(runSimple);
            console.log(jsonResult)
            expect(jsonResult.jobResult[0].result).to.be.equal(42)
        }).timeout(1000 * 60 * 6)


        it('exec  algorithm noWait', async () => {
            const runSimple = "hkubectl exec algorithm green-alg --noWait"
            const jsonResult = await execSyncReturenJSON(runSimple)

            console.log(jsonResult)
            const result = await getResult(jsonResult.jobId,200)
            console.log(result)
            expect(result.data[0].result).to.be.equal(42)
        }).timeout(1000 * 60 * 6)

        it('exec stop pipe ', async () => {
            const runSimple = "hkubectl exec stored simple --noWait"
            const jsonResult = await execSyncReturenJSON(runSimple)

            console.log(jsonResult)

            const stop = "hkubectl exec stop --jobId = "+jsonResult.jobId

            const stopResult = await execSyncReturenJSON(stop)
            console.log(stopResult)
            const result = await getResult(jsonResult.jobId,200)
            console.log(result)
            expect(result.status).to.be.equal("stopped")
        }).timeout(1000 * 60 * 6)


        it('exec status pipe ', async () => {
            const runSimple = "hkubectl exec stored simple --noWait"
            const jsonResult = await execSyncReturenJSON(runSimple)

            console.log(jsonResult)
            const status = "hkubectl exec status --jobId = "+jsonResult.jobId
            const array = []
            array.push(execSyncReturenJSON(status))
            array.push(getJobIdStatus(jsonResult.jobId))
            const statuses = await Promise.all(array)
            expect(statuses[0].result.status).to.be.equal(statuses[1].body.status)

        }).timeout(1000 * 60 * 6)

        it('exec get pipe ', async () => {
            
            const get = "hkubectl exec get simple"
            const output = await exceSyncString(get);

            expect(output).contain("name:      simple")

        }).timeout(1000 * 60 * 6)

        it('exec results pipe ', async () => {
            const runSimple = "hkubectl exec stored simple --noWait"
            const jsonResult = await execSyncReturenJSON(runSimple)
            console.log(jsonResult)
            const result = await getResult(jsonResult.jobId,200)
            console.log(result)

            
            const cti = " hkubectl exec result --jobId = "+jsonResult.jobId
            
            const output = await exceSyncString(cti);

            //const ctlResult = await execSyncReturenJSON(cti)

            console.log(result)

            expect(output).to.contain("result:        42")
        }).timeout(1000 * 60 * 6)

    });

    describe('sync test', ()=>{
        const delay = require('delay')
        function execShellCommand(cmd) {
            const exec = require('child_process').exec;
            return new Promise((resolve, reject) => {
             exec(cmd, (error, stdout, stderr) => {
              if (error) {
               console.warn(error);
              }
              resolve(stdout? stdout : stderr);
             });
            });
           }
        it('synce create watch python',async ()=>{
            const filePath = path.join(process.cwd(), 'additionalFiles/main.py');
            const algName = pipelineRandomName(8).toLowerCase()
            const folderPath = path.join(process.cwd(),algName)
            var fs = require('fs');
          
            if (!fs.existsSync(algName)){
                fs.mkdirSync(algName);}

            var data = fs.readFileSync(filePath, 'utf8');
            fs.writeFileSync(`${folderPath}/main.py`, data, {encoding:'utf8',flag:'w'} )
            
            const command = ` hkubectl sync create`+
                            ` --entryPoint main.py`+
                            ` --algorithmName ${algName}`+
                            ` --folder ${folderPath}`+
                            ` --env python`
            console.log(command)
            await exceSyncString(command)
            
            const watch = `hkubectl sync watch`+
                           ` -a ${algName}`+
                           ` -f ${folderPath}`

            execShellCommand(watch)

            await delay(20*1000)
            const result = await runAlgGetResult(algName,[4])
            
          //  await deleteAlgorithm(algName,true)    
            expect(result.data[0].result.version.toString()).to.be.equal("1")  

            const newmain = data.replace(`"version":"1"`,`"version":"2"`)

            fs.writeFileSync(`${folderPath}/main.py`, newmain, {encoding:'utf8',flag:'w'} )
            await delay(20*1000)
            const result2 = await runAlgGetResult(algName,[4])
            await deleteAlgorithm(algName,true)
            expect(result2.data[0].result.version.toString()).to.be.equal("2")  

        }).timeout(1000 * 60 * 10)
    })
});
