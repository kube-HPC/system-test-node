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
    getExecPipeline,
    runRaw,
    getPipeline,
    getPipelineStatus,
    storePipeline,
    runStored,
    deconstructTestData,
    runStoredAndWaitForResults,
    resumePipeline,
    pausePipeline,
    stopPipeline,
    exceCachPipeline
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))

chai.use(chaiHttp);

describe('pipeline Tests', () => {

    describe('pipeline Types', () => {

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

        it('type= raw', async () => {
            
            const res = await runRaw(rawPipe)

            // write_log(res.body)
            expect(res).to.have.status(200)

            const jobId = res.body.jobId
            await delay(3 * 1000)
             await getResult(jobId, 200)
            //result.status.should.equal('completed')
            const status = await  getExecPipeline(jobId)
            expect(status.body.types[0]).to.be.equal("raw");
        }).timeout(1000 * 60 * 2)

        it('type= caching', async () => {
            
            const res = await runRaw(rawPipe)
            // write_log(res.body)
            expect(res).to.have.status(200)
            const jobId = res.body.jobId
            await delay(3 * 1000)
             await getResult(jobId, 200)
            
            const res2 = await exceCachPipeline(jobId,"node2")
            const jobId2 = res2.body.jobId
             await getResult(jobId2, 200)
             const status = await  getExecPipeline(jobId2)
             expect(status.body.types).includes("raw");
             expect(status.body.types).includes("caching");

        }).timeout(1000 * 60 * 2)
    })

    it('type= stored', async () => {
        const pipe = {
            name: "simple",
            flowInput: {
                files: {
                    link: "link1"
                }
            },
            priority: 4
        }
        const res = await runStored(pipe)

        // write_log(res.body)
        expect(res).to.have.status(200)

        const jobId = res.body.jobId
        await delay(3 * 1000)
         await getResult(jobId, 200)
        //result.status.should.equal('completed')
        const status = await  getExecPipeline(jobId)
        expect(status.body.types[0]).to.be.equal("stored");
    }).timeout(1000 * 60 * 2)



    describe('pause_resume_pipelineas',()=>{   
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

        const d = deconstructTestData(testData2)
       

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