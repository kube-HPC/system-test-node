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
        deleteAlgorithmVersion
    } = require(path.join(process.cwd(), 'utils/algorithmUtils'))

const {filterPodsByName} = require(path.join(process.cwd(), 'utils/kubeCtl'))

const {
    testData1,
    testData4,
    testData3
} = require(path.join(process.cwd(), 'config/index')).algorithmTest


const {
    getResult,
    getRawGraph,
    getParsedGraph
  } = require(path.join(process.cwd(), 'utils/results'))

// const KubernetesClient = require('@hkube/kubernetes-client').Client;
const {
    deletePipeline,
    getPipeline,
    getPipelineStatus,
    storePipeline,
    runStored,
    deconstructTestData,
    runStoredAndWaitForResults
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))

chai.use(chaiHttp);

describe('Alrogithm Tests', () => {

    describe('TID 480 - Test Algorithm ttl (git 61 342)',()=>{ 
        it('ttl = 3 one of the inputs = 5 seconds ',async ()=>{ 
            const d = deconstructTestData(testData3)
            await deletePipeline(d)
            await storePipeline(d)
            const jobId = await runStoredAndWaitForResults(d)
            const graph = await getRawGraph(jobId)
            const nodesStatus = graph.body.nodes[0].batch
            const nodesError = nodesStatus.filter(obj => obj.error=="Algorithm TTL expired")
            expect(nodesError.length).to.be.equal(1)
           
        }).timeout(1000 * 60 * 5);

        it('ttl =0 one of the inputs = 5 seconds',async ()=>{ 
            const d = deconstructTestData(testData3)
            await deletePipeline(d)
            d.pipeline.nodes[0].ttl=0
            await storePipeline(d)
            const jobId = await runStoredAndWaitForResults(d)
            const graph = await getRawGraph(jobId)
            const nodesStatus = graph.body.nodes[0].batch
            const nodesError = nodesStatus.filter(obj => obj.error=="Algorithm TTL expired")
            expect(nodesError.length).to.be.equal(0)
        }).timeout(1000 * 60 * 5);
        
     })

    describe('Test Algorithm Version (git 560 487)',()=>{   
        //https://app.zenhub.com/workspaces/hkube-5a1550823895aa68ea903c98/issues/kube-hpc/hkube/560
        const algorithmName = "algorithm-version-test"
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
        const d = deconstructTestData(testData1)
        //store pipeline
        it('Update  Algorithm version', async () => {
            await  deleteAlgorithm(algorithmName,true)
            await buildAlgoFromImage(algorithmV1);
            const algVersion = await getAlgorithmVersion(algorithmName);
            expect(algVersion.body.length).to.be.equal(1)
            await buildAlgoFromImage(algorithmV2);
            //validate there are two images
            const algVersion2 = await getAlgorithmVersion(algorithmName);
            expect(algVersion2.body.length).to.be.equal(2)

            //store pipeline algorithm-version-test
            await storePipeline(d)
            const jobId = await runStoredAndWaitForResults(d)
            // result should be (v1)        
            const result1 = await getResult(jobId,200)
            expect(result1.data[0].result.vaerion).to.be.equal("v1")
            
            const update = await updateAlgorithmVersion(algorithmName,algorithmImageV2,true);
            await delay(2000)
            const jobId2 = await runStoredAndWaitForResults(d)
            //validate result should be (v2)
            const result2 = await getResult(jobId2,200)
            expect(result2.data[0].result.vaerion).to.be.equal("v2")

            await  deleteAlgorithm(algorithmName,true)
        }).timeout(1000 * 60 * 10);



        it('Delete  Algorithm deletes pipeline', async () => {

            await  deleteAlgorithm(algorithmName,true)
            await buildAlgoFromImage(algorithmV1);        
        
            //store pipeline algorithm-version-test
            await storePipeline(d)
           // const jobId = await runStoredAndWaitForResults(d)        
            await buildAlgoFromImage(algorithmV2);       
            //const update = await updateAlgorithmVersion(algorithmName,algorithmImageV2,true);
            await delay(2000)
            //const jobId2 = await runStoredAndWaitForResults(d)       
            const alg = await deleteAlgorithm(algorithmName,true)
            await delay(2000)
            const pipeline = await getPipeline(d.name)
            expect(pipeline.body.error.message).to.include("Not Found")  
            const getAlg = await getAlgorithm(algorithmName)
            expect(getAlg.body.error.message).to.include("Not Found")     

        }).timeout(1000 * 60 * 5);


        it('Delete  Algorithm deletes versions', async () => {
            //validate that after delete old algorith, version are deleted.
            await  deleteAlgorithm(algorithmName,true)
            await buildAlgoFromImage(algorithmV1);         
            await buildAlgoFromImage(algorithmV2);              
            await delay(2000)
        
            await  deleteAlgorithm(algorithmName,true)
            await buildAlgoFromImage(algorithmV1);  
            const algVersion1 = await getAlgorithmVersion(algorithmName);
            expect(algVersion1.body.length).to.be.equal(1)
            await  deleteAlgorithm(algorithmName,true)
            
        }).timeout(1000 * 60 * 5);

        it('Update algorithm version while executing force = true', async () => {
            const pipe = {   
                name: d.name,
                flowInput: {
                    inp: 30000
                }
            }
            await deleteAlgorithm(algorithmName,true)
            await buildAlgoFromImage(algorithmV1);         
            await buildAlgoFromImage(algorithmV2);              
            await delay(2000)
            await storePipeline(d)
            const res = await runStored(pipe)        
            const jobId = res.body.jobId
            await delay(10000)
            const update = await updateAlgorithmVersion(algorithmName,algorithmImageV2,true);
            expect(update.status).to.be.equal(201);
            await delay(5000);
            const status = await getPipelineStatus(jobId)
            expect(status.body.status).to.be.equal("failed")
            const alg = await getAlgorithm(algorithmName)
            expect(alg.body.algorithmImage).to.be.equal(algorithmImageV2)
            await deleteAlgorithm(algorithmName,true)
            
            
            
        }).timeout(1000 * 60 * 5);

        it('Try Update algorithm version while executing force = false', async () => {
        
            const pipe = {   
                name: d.name,
                flowInput: {
                    inp: 30000
                }
            }

            await deleteAlgorithm(algorithmName,true)
            await buildAlgoFromImage(algorithmV1);         
            await buildAlgoFromImage(algorithmV2);              
            await delay(2000)
            await storePipeline(d)
            const res = await runStored(pipe)        
            const jobId = res.body.jobId
            await delay(10000)
            const update = await updateAlgorithmVersion(algorithmName,algorithmImageV2,false);
            expect(update.status).to.be.equal(400);
            await delay(3000)
            const result2 = await getResult(jobId,200)
            expect(result2.data[0].result.vaerion).to.be.equal("v1")               
            const alg = await getAlgorithm(algorithmName)
            expect(alg.body.algorithmImage).to.be.equal(algorithmImageV1)
            await deleteAlgorithm(algorithmName,true)
            
            
            
        }).timeout(1000 * 60 * 5);

    

        it('Delete  algorithm current version ', async () => {
        

            await deleteAlgorithm(algorithmName,true)
            await buildAlgoFromImage(algorithmV1);         
            await buildAlgoFromImage(algorithmV2);              
            await delay(2000)
            
            const update = await updateAlgorithmVersion(algorithmName,algorithmImageV2,false);
            let deleteAlg  =await deleteAlgorithmVersion(algorithmName,algorithmImageV2);
            expect(deleteAlg.body.error.message).to.be.equal("unable to remove used version")
            deleteAlg  =await deleteAlgorithmVersion(algorithmName,algorithmImageV1);
            expect(deleteAlg.status).to.be.equal(200)
            const algVersion = await getAlgorithmVersion(algorithmName)
            expect(algVersion.body.length).to.be.equal(1)

            await deleteAlgorithm(algorithmName,true)
            
            
            
        }).timeout(1000 * 60 * 5);

    } )
    
    describe('Test algorithm Environment Variables',()=>{
    it('algorithm Environment Variables',async ()=>{
        let alg ={
            name: "convimagetob",
            cpu: 1,
            gpu: 0,
            mem: "256Mi",
            minHotWorkers: 0,
        
            type: "Image",
            env: "python",
            entryPoint: "main-image-to-Bynary.py",
            options: {
                binary: true,               
                debug: false,
                pending: false
                }       ,
            algorithmImage: "docker.io/hkubedev/convimagetobi:v77e81c13fbbb6295755d548ba8c8f0362b0c73c9",
            algorithmEnv: {
                FOO: "I got foo"
            }

        }
        const algRun = {name: alg.name,
            input:[]}
        await  deleteAlgorithm(alg.name,true)
        await buildAlgoFromImage(alg);
        const res = await runAlgorithm(algRun)
        const jobId = res.body.jobId
        const result = await  getResult(jobId,200)
        expect(result.data[0].result.EnvironmentVariables).to.be.equal(alg.algorithmEnv.FOO)
    }).timeout(1000 * 5*60)


    it('algorithm hot workers',async ()=>{
        let  alg = {
            name: "hot-worker-alg",
            cpu: 1,
            gpu: 0,
            mem: "256Mi",
            minHotWorkers: 0,
            algorithmImage: "tamir321/versatile:04",
            minHotWorkers :3,
            type: "Image",
            options: {
                debug: false,
                pending: false
                }       
            }
       
        await  deleteAlgorithm(alg.name,true)
        await buildAlgoFromImage(alg);
        await delay(30000)
        const workers = await filterPodsByName(alg.name)
        await  deleteAlgorithm(alg.name,true)
        expect(workers.length).to.be.equal(alg.minHotWorkers)
    }).timeout(1000 * 5*60)
})
    describe('algorithm execute another',()=>{
        it('TID-600 algorithm execute another algorithm (git 288)', async () => {
            let alg = {
                        name: "versatile",
                        cpu: 1,
                        gpu: 0,
                        mem: "256Mi",
                        minHotWorkers: 0,
                        algorithmImage: "tamir321/versatile:04",
                        type: "Image",
                        options: {
                            debug: false,
                            pending: false
                            }       
                }
            const aa = await  deleteAlgorithm("versatile",true)
            const bb = await buildAlgoFromImage(alg);
    //need to add alg versatile-pipe
            const algName = "black-alg"
            const pipe = {
                "name": "versatile-pipe",
                "flowInput": {
                    "inp": [{
                        "type": "algorithm",
                        "name": `${algName}`,
                        "input":["a"]
                    }]
                }
            }
            const d = deconstructTestData(testData4)
    
            //store pipeline evalwait
            const a = await storePipeline(d)
        
            //run the pipeline evalwait
           
    
            const jobId = await runStoredAndWaitForResults(pipe)
           
            const graph = await getRawGraph(jobId)
            expect(graph.body.nodes.length).to.be.equal(2)

        }).timeout(1000 * 5*60)
    })
   

});