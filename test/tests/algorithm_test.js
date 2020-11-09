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

 //const {filterPodsByName} = require(path.join(process.cwd(), 'utils/kubeCtl'))

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

// // const KubernetesClient = require('@hkube/kubernetes-client').Client;
 const {
    runRaw,
     deletePipeline,
     getPipeline,
     getPipelineStatus,
     storePipeline,
     runStored,
     deconstructTestData,
     runStoredAndWaitForResults
 } = require(path.join(process.cwd(), 'utils/pipelineUtils'))

 chai.use(chaiHttp);


 const {getWebSocketData} = require(path.join(process.cwd(), 'utils/socketGet'))
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
    

    describe('Test algorithm reservedMemory',()=>{

        it('validate that  reservedMemory Variables saved as DISCOVERY_MAX_CACHE_SIZE',async ()=>{
            let alg ={
                name: "env",
                cpu: 1,
                gpu: 0,
                mem: "256Mi",
                reservedMemory: "3Gi",
                minHotWorkers: 0,
                env: "python",
                entryPoint: "main",
                type: "Image",
                options: {
                    "debug": false,
                    "pending": false
                },
                "version": "1.0.0",
                algorithmImage: "docker.io/hkubedev/env:v1.0.0"
            }

            const pipe = {
                name: "env",
               
                nodes: [
                    {
                        algorithmName: "env",
                        input: [
                            "DISCOVERY_MAX_CACHE_SIZE"
                        ],
                        nodeName: "env"
                    }
                ],                                
                options: {
                    "batchTolerance": 100,
                    "concurrentPipelines": {
                        "amount": 10,
                        "rejectOnFailure": true
                    },
                    "progressVerbosityLevel": "info",
                    "ttl": 3600
                },
                priority: 3,
                experimentName: "main",
                
            }
            await  deleteAlgorithm(alg.name,true)
            alg.reservedMemory= "3Gi"
            await buildAlgoFromImage(alg);
           // const jnk = await buildAlgoFromImage(alg);
            const res =  await runRaw(pipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200)
            console.log(result)
            expect(result.data[0].result).to.be.equal("3072")
            alg.name = "env1"
            alg.reservedMemory= "512Mi"
            pipe.nodes[0].algorithmName="env1"
            await  deleteAlgorithm(alg.name,true)
            await buildAlgoFromImage(alg);
            const res2 =  await runRaw(pipe)
            const jobId2 = res2.body.jobId
            const result2 = await  getResult(jobId2,200)
            expect(result2.data[0].result).to.be.equal("512")
            console.log(result2)
        }).timeout(1000 * 5*60)
    
    })    

    describe('Test algorithm Environment Variables',()=>{
        let alg ={
            name: "ev",
            cpu: 1,
            gpu: 0,
            mem: "256Mi",
            minHotWorkers: 0,
        
            type: "Image",
            env: "python",
            entryPoint: "main",
            options: {
                binary: true,               
                debug: false,
                pending: false
                }       ,
            algorithmImage:  "docker.io/hkubedev/tamir-test:v1.0.0",
            algorithmEnv: {
                FOO: "I got foo",
                SECRET:{"secretKeyRef": {
                    "name": "docker-credentials-secret",
                    "key": "docker_push_password"
                }},
                CM:{"configMapKeyRef": {
                    "name": "api-server-configmap",
                    "key": "DEFAULT_STORAGE"
                }},
                
                REASOURCE:{
                    "resourceFieldRef": {
                        "containerName": "algorunner",
                        "resource": "requests.cpu"
                    }
                }
                ,
                FR : {
                    "fieldRef":{
                        "fieldPath": "spec.nodeName"}
              
                }
    
            }

        }
        let algCreated= false
        const createAlg = async ()=>{
            if(!algCreated){
                await  deleteAlgorithm(alg.name,true)
                await buildAlgoFromImage(alg);
                algCreated =true

            }
           
        }

        it('algorithm Environment Variables ',async ()=>{
            await createAlg()
            const algRun = {name: alg.name,
                input:[{"action":"env","EnvironmentVariable":"FOO"}]}
         
            const res = await runAlgorithm(algRun)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200)
            expect(result.data[0].result.EnvironmentVariables).to.be.equal(alg.algorithmEnv.FOO)
        }).timeout(1000 * 5*60)

        it('algorithm Environment Variables secretKeyRef',async ()=>{
            await createAlg()
            const algRun = {name: alg.name,
                input:[{"action":"env","EnvironmentVariable":"SECRET"}]}
        
            const res = await runAlgorithm(algRun)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200)
            expect(result.data[0].result.EnvironmentVariables).to.contain("Mmhy6")
        }).timeout(1000 * 5*60)

        it('algorithm Environment Variables configMapKeyRef',async ()=>{
            await createAlg()
            const algRun = {name: alg.name,
                input:[{"action":"env","EnvironmentVariable":"CM"}]}
           
            const res = await runAlgorithm(algRun)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200)
            expect(result.data[0].result.EnvironmentVariables).to.be.equal("fs")
        }).timeout(1000 * 5*60)

    it('algorithm Environment Variables resourceFieldRefCE',async ()=>{
        await createAlg()
        const algRun = {name: alg.name,
            input:[{"action":"env","EnvironmentVariable":"REASOURCE"}]}

        const res = await runAlgorithm(algRun)
        const jobId = res.body.jobId
        const result = await  getResult(jobId,200)
        expect(result.data[0].result.EnvironmentVariables).to.be.equal("1")
    }).timeout(1000 * 5*60)


    it('algorithm Environment Variables fieldRef',async ()=>{
        await createAlg()

        const algRun = {name: alg.name,
            input:[{"action":"env","EnvironmentVariable":"FR"}]}
  
        const res = await runAlgorithm(algRun)
        const jobId = res.body.jobId
        const result = await  getResult(jobId,200)
        expect(result.data[0].result.EnvironmentVariables).to.contain("compute.internal")
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
        await delay(20000)
        const data = await getWebSocketData()
        const workers = data.discovery.worker.filter(worker => worker.algorithmName == alg.name)
       // const workers = await filterPodsByName(alg.name)
        await  deleteAlgorithm(alg.name,true)
        expect(workers.length).to.be.equal(alg.minHotWorkers)
    }).timeout(1000 * 5*60)
    


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
   

})
})
