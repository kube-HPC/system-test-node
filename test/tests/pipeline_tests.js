const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')

const { runAlgorithm,
        deleteAlgorithm,
        getAlgorithm,    
        getAlgorithmVersion,
        updateAlgorithmVersion,
        buildAlgoFromImage,
        deleteAlgorithmVersion,
        getAlgorithim} = require(path.join(process.cwd(), 'utils/algorithmUtils'))


const {   
    testData1,
    testData2,
    testData3,
    testData4
} = require(path.join(process.cwd(), 'config/index')).pipelineTest


const {
    getResult,
    getCronResult
  } = require(path.join(process.cwd(), 'utils/results'))

// const KubernetesClient = require('@hkube/kubernetes-client').Client;
const {
    getExecPipeline,
    runRaw,
    deletePipeline,
    pipelineRandomName,
    getPipelineStatus,
    storePipeline,
    runStored,
    deconstructTestData,
    runStoredAndWaitForResults,
    resumePipeline,
    pausePipeline,
    stopPipeline,
    exceCachPipeline,
    getPipelinestatusByName
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))

chai.use(chaiHttp);

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
describe('pipeline Tests', () => {
    
    describe('pipeline includeInResults', () => {
        it('yellow node includeInResults = true', async () => {

            const d = deconstructTestData(testData2)
            await deletePipeline(d)
            await storePipeline(d)
            const jobId = await runStoredAndWaitForResults(d)
            const result = await getResult(jobId,200)
            const yellow = result.data.filter(obj => obj.nodeName=="yellow")
            expect(yellow.length).to.be.equal(7)
            const black = result.data.filter(obj => obj.nodeName=="black")
            expect(black.length).to.be.equal(1)
        }).timeout(1000 * 60 * 2)


        it('yellow node includeInResults = false', async () => {

            const d = deconstructTestData(testData2)
            await deletePipeline(d)
            d.pipeline.nodes[1].includeInResults=false
            await storePipeline(d)
            const jobId = await runStoredAndWaitForResults(d)
            const result = await getResult(jobId,200)
            const yellow = result.data.filter(obj => obj.nodeName=="yellow")
            expect(yellow.length).to.be.equal(0)
            const black = result.data.filter(obj => obj.nodeName=="black")
            expect(black.length).to.be.equal(1)
        }).timeout(1000 * 60 * 2)
    })
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
             expect(status.body.types).includes("node");

        }).timeout(1000 * 60 * 2)
    
        it.skip("type= Triger", async () => {
            const simpleName =testData2.descriptor.name
            const simple = deconstructTestData(testData2)
            await deletePipeline(simple)
            await storePipeline(simple)
            testData2.descriptor.name= pipelineRandomName(8)
            testData2.descriptor.triggers.pipelines = [simpleName]
            const d = deconstructTestData(testData2)
            await deletePipeline(d)
            await storePipeline(d)
            await runStoredAndWaitForResults(simple)
            //expect(status.body.types).includes("raw");
            // bug was open cant get pipeline result by name
           //await deletePipeline(d)
        }).timeout(1000 * 60 * 7);

        it("type= Sub-pipeline", async () => {
            const pipelineName = pipelineRandomName(8)
           
            const pipe = {
                "name": "versatile-pipe",
                "flowInput": {
                    "inp": [{
                        "type": "storedPipeline",
                        "name": `${pipelineName}`,
                        "input":["a"]
                    }]
                }
            }
            
            testData2.descriptor.name= pipelineName         
            const d = deconstructTestData(testData2)
            await storePipeline(d)
            // testData4 = versatile-pipe
            const e = deconstructTestData(testData4)
            await storePipeline(e)
            await runStoredAndWaitForResults(pipe)
            const res = await getPipelinestatusByName(pipelineName)
            const status = await  getExecPipeline(res.body[0].jobId)
            expect(status.body.types).includes("stored");
            expect(status.body.types).includes("sub-pipeline");
            expect(status.body.types).includes("internal");
            await deletePipeline(d)
        }).timeout(1000 * 60 * 7);

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

    it('type = algorithm ',async ()=>{
        const alg = {name: 'green-alg',
                        input:[1]}
        const res = await runAlgorithm(alg)
        const jobId = res.body.jobId
        await  getResult(jobId,200)
        const status = await  getExecPipeline(jobId)
        expect(status.body.types[0]).to.be.equal("algorithm");
    }).timeout(1000 * 60 * 2)


    it('type = raw tensor',async ()=>{
        const algorithmName = "tensor1"
        const python27 = "docker.io/hkubedev/tensor1:v1.0.1"
        const algpython27 = algJson(algorithmName,python27)                  
        await buildAlgoFromImage(algpython27);
        const tensorRawPipe = {
            name: "tesorPipe",
            nodes: [{
                    nodeName: "node1",
                    algorithmName: "tensor1",
                    input: [],
                    metrics:{
                        tensorboard:true
                    }
                }
            ]
        }
        
        const res = await runRaw(tensorRawPipe)

        // write_log(res.body)
        expect(res).to.have.status(200)

        const jobId = res.body.jobId
        await delay(3 * 1000)
         await getResult(jobId, 200)
        //result.status.should.equal('completed')
        const status = await  getExecPipeline(jobId)
        expect(status.body.types[1]).to.be.equal("tensorboard");
        expect(status.body.types[0]).to.be.equal("raw");
    }).timeout(1000 * 60 * 10)


    it("type = cron  internal ", async () => {
   
        testData3.descriptor.name= pipelineRandomName(8)
        const d = deconstructTestData(testData3)
        await storePipeline(d)
        await delay(1000*90)
        
        const result =  await getCronResult(d.name,5)
        const jobId = result.body[0].jobId
        const status = await  getExecPipeline(jobId)
        await deletePipeline(d)

        const types = status.body.types
        const expected = ["cron","internal","stored"]
        const a = expected.filter(v=> types.includes(v) )
        expect(a.length).to.be.equal(3)

    }).timeout(1000 * 60 * 7);

})
    describe('pause_resume_pipelineas',()=>{   
        const algorithmName = "algorithm-version-test"
        const algorithmImageV1 = "tamir321/algoversion:v1"

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