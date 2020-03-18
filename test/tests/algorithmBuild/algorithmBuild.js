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
const fse = require('fs')


const delay = require('delay');

const {
    getResult,
    getStatusall,
    idGen,
    runRaw,
    getRawGraph,
    getParsedGraph
} = require(path.join(process.cwd(), 'utils/results'))
const {
    pipelineRandomName,
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
    buildAlgorithm,    
    getAlgorithim} = require(path.join(process.cwd(), 'utils/algorithmUtils'))

chai.use(chaiHttp);

chai.use(assertArrays);

describe('Algorithm build test', () => {
    
    const runAlgGetResult =async (algName,inupts)=>{
        const alg = {name: algName,
        input:inupts}
        const res = await runAlgorithm(alg)
        const jobId = res.body.jobId
        const result = await  getResult(jobId,200)
        return result
       // expect(result.data[0].result).to.be.equal(42)
    }
    describe('python version test', () => {
        const code1 = path.join(process.cwd(), 'additionalFiles/python.versions.tar.gz');
    
        it(`python 2.7`, async () => {
            const entry = 'main27'
            const algName= pipelineRandomName(8).toLowerCase()    
            const pythonVersion = "python:2.7"                    
            
            const buildStatusAlg = await buildAlgorithm(code1, algName,entry,pythonVersion)
            expect(buildStatusAlg.status).to.be.equal("completed") 
            const result = await runAlgGetResult(algName,[4])
            await deleteAlgorithm(algName,true)    
            expect(result.data[0].result.sysVersion.toString()).to.be.equal("2")  
        }).timeout(1000 * 60 * 20)

        it(`python 3.5`, async () => {
            const entry = 'main35'
            const algName= pipelineRandomName(8).toLowerCase()    
            const pythonVersion = "python:3.5"                    
            
            const buildStatusAlg = await buildAlgorithm(code1, algName,entry,pythonVersion)
            expect(buildStatusAlg.status).to.be.equal("completed") 
            const result = await runAlgGetResult(algName,[4])
            await deleteAlgorithm(algName,true)    
            expect(result.data[0].result.sysVersion.toString()).to.be.equal("3,5,9,final,0")    
        }).timeout(1000 * 60 * 20)


        it(`python 3.6`, async () => {
            const entry = 'main36'
            const algName= pipelineRandomName(8).toLowerCase()    
            const pythonVersion = "python:3.6"                    
            
            const buildStatusAlg = await buildAlgorithm(code1, algName,entry,pythonVersion)
            expect(buildStatusAlg.status).to.be.equal("completed") 
            const result = await runAlgGetResult(algName,[4])
            await deleteAlgorithm(algName,true)    
            expect(result.data[0].result.sysVersion.toString()).to.be.equal("3,6,10,final,0")  
        }).timeout(1000 * 60 * 20)

        it(`python 3.7`, async () => {
            const entry = 'main37'
            const algName= pipelineRandomName(8).toLowerCase()    
            const pythonVersion = "python:3.7"                    
            
            const buildStatusAlg = await buildAlgorithm(code1, algName,entry,pythonVersion)
            expect(buildStatusAlg.status).to.be.equal("completed") 
            const result = await runAlgGetResult(algName,[4])
            await deleteAlgorithm(algName,true)    
            expect(result.data[0].result.sysVersion.toString()).to.be.equal("3,7,7,final,0")  
        }).timeout(1000 * 60 * 20)

        it(`python 3.7-slim`, async () => {
            const entry = 'main37slim'
            const algName= pipelineRandomName(8).toLowerCase()    
            const pythonVersion = "python:3.7-slim"                    
            
            const buildStatusAlg = await buildAlgorithm(code1, algName,entry,pythonVersion)
            expect(buildStatusAlg.status).to.be.equal("completed") 
            const result = await runAlgGetResult(algName,[4])
            await deleteAlgorithm(algName,true)    
            expect(result.data[0].result.sysVersion.toString()).to.be.equal("3,7,7,final,0")   
        }).timeout(1000 * 60 * 20)


})

describe('requirements ', () => {
    

    it(`python with requirements - tensore`, async () => {
        const code = path.join(process.cwd(), 'additionalFiles/tensor.tar.gz');
        const entry = 'main'
        const algName= pipelineRandomName(8).toLowerCase()    
        //const pythonVersion = "python:3.6"                    
        
        const data = {
            name: algName,
            env: 'python',
            cpu: 1,
            gpu: 0,
            mem: '5Gi',
            entryPoint: entry,
            minHotWorkers: 0,
            version: idGen()//,
            //baseImage:pythonVersion
        }
    
        const res = await chai.request(config.apiServerUrl)
            .post('/store/algorithms/apply')
            .field('payload', JSON.stringify(data))
            .attach('file', fse.readFileSync(code), entry)
    
      
    
        // res.should.have.status(200)
        expect(res.status).to.eql(200)
        const buildIdAlg = res.body.buildId
        const buildStatusAlg = await getStatusall(buildIdAlg, `/builds/status/`, 200, "completed", 1000 * 60 * 10)

        expect(buildStatusAlg.status).to.be.equal("completed") 
        const result = await runAlgGetResult(algName,[4])
        await deleteAlgorithm(algName,true)    
        expect(result.status).to.be.equal("completed")  
    }).timeout(1000 * 60 * 20)


    it("test webhook git",async ()=>{
        const data = {
            ref: 'refs/heads/master',
            before: 'dcc8a45a01f0ed6a0fe19e231cbd269ce2ebc9fa',
            after: 'dcc8a45a01f0ed6a0fe19e231cbd269ce2ebc9fa',
          
            commits: [
                {
                    id: 'dcc8a45a01f0ed6a0fe19e231cbd269ce2ebc9fa'
                    
                }
            ],
           
            repository: {
               
                html_url: 'https://github.com/tamir321/hkube.git',
                description: null,
                fork: false,
                url: 'https://github.com/tamir321/hkube'                
            }
          
        }

       

        const f = JSON.stringify(data)
        const res = await chai.request(config.apiServerUrl)           
            .post('/builds/webhook/github')
            .type('form')
            .set('content-type', 'application/x-www-form-urlencoded')            
            .send ({'payload': JSON.stringify(data)}) 

        
    }).timeout(1000 * 60 * 20)
})

})