const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')

const { deleteAlgorithm,
        getAlgorithm,    
        getAlgorithmVersion,
        updateAlgorithmVersion,
        buildAlgoFromImage,
        deleteAlgorithmVersion,
        getAlgorithim} = require(path.join(process.cwd(), 'utils/algorithmUtils'))


const {
    testData1,
    testData2
} = require(path.join(process.cwd(), 'config/index')).algorithmTest


const {
    getResult
  } = require(path.join(process.cwd(), 'utils/results'))

// const KubernetesClient = require('@hkube/kubernetes-client').Client;
const {
    getPipeline,
    getPipelineStatus,
    storePipeline,
    runStored,
    deconstructTestData,
    runStoredAndWaitForResults,
    resumePipeline,
    pausePipeline,
    stopPipeline
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))

chai.use(chaiHttp);

describe('pipeline Tests', () => {
    describe('ppause_resume_pipelineas',()=>{   
        const algorithmName = "algorithm-version-test"
        const algorithmImageV1 = "tamir321/algoversion:v1"

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

        const d = deconstructTestData(testData1)
       

        it('pause resume pipeline', async () => {
            const pipe = {   
                name: d.name,
                flowInput: {
                    inp: 15000
                }
            }
            await deleteAlgorithm(algorithmName,true)
            await buildAlgoFromImage(algorithmV1);         
               
            await delay(2000)
            await storePipeline(d)
            const res = await runStored(pipe)        
            const jobId = res.body.jobId
            await delay(3000)
           
            const pause = await pausePipeline(jobId);
            await delay(3000)
            let pipelineStatus = await getPipelineStatus(jobId)
            expect(pipelineStatus.body.status).to.be.equal("paused")
            const resume = await resumePipeline(jobId);
            const result = await getResult(jobId,200)
            
            
        }).timeout(1000 * 60 * 5);


        it('pause stop pipeline', async () => {
            const pipe = {   
                name: d.name,
                flowInput: {
                    inp: 15000
                }
            }
            await deleteAlgorithm(algorithmName,true)
            await buildAlgoFromImage(algorithmV1);         
               
            await delay(2000)
            await storePipeline(d)
            const res = await runStored(pipe)        
            const jobId = res.body.jobId
            await delay(3000)
           
            const pause = await pausePipeline(jobId);
            await delay(3000)
            let pipelineStatus = await getPipelineStatus(jobId)
          
            const stop = await stopPipeline(jobId);
            const result = await getPipelineStatus(jobId)
            expect(result.body.status).to.be.equal("stopped")
            
        }).timeout(1000 * 60 * 5);

        
    } )
    
   

});