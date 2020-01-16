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
        deleteAlgorithmVersion
    } = require(path.join(process.cwd(), 'utils/algorithmUtils'))


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
    runStoredAndWaitForResults
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))

chai.use(chaiHttp);

describe('Alrogithm Tests', () => {
    describe('Test Algorithm Version',()=>{   
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
        }).timeout(1000 * 60 * 5);



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

        it('Update algorithim version while excuting force = true', async () => {
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

        it('Try Update algorithim version while excuting force = false', async () => {
        
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

        it('Try Update algorithim version while excuting pipeline force = true', async () => {
            
            const e = deconstructTestData(testData2)

            const pipe = {   
                name: e.name,
                flowInput: {
                    inp: 30000

                }
            }

            await deleteAlgorithm(algorithmName,true)
            await buildAlgoFromImage(algorithmV1);         
            await buildAlgoFromImage(algorithmV2);              
            await delay(2000)
            await storePipeline(e)
            const res = await runStored(pipe)        
            const jobId = res.body.jobId
            await delay(10000)
            const update = await updateAlgorithmVersion(algorithmName,algorithmImageV2,true);
           
            await delay(5000)
            const status = await getPipelineStatus(jobId)
            expect(status.body.status).to.be.equal("failed")
            await deleteAlgorithm(algorithmName,true)
            
            
            
        }).timeout(1000 * 60 * 5);

        it('Try Update algorithim version while excuting pipeline force = false', async () => {
            
            const e = deconstructTestData(testData2)

            const pipe = {   
                name: e.name,
                flowInput: {
                    inp: 30000

                }
            }

            await deleteAlgorithm(algorithmName,true)
            await buildAlgoFromImage(algorithmV1);         
            await buildAlgoFromImage(algorithmV2);              
            await delay(2000)
            await storePipeline(e)
            const res = await runStored(pipe)        
            const jobId = res.body.jobId
            await delay(10000)
            const update = await updateAlgorithmVersion(algorithmName,algorithmImageV2,false);
            expect(update.status).to.be.equal(400);
            const result = await getResult(jobId,200)
            expect(result.data[0].result.vaerion).to.be.equal("v1")               
            const alg = await getAlgorithm(algorithmName)
            expect(alg.body.algorithmImage).to.be.equal(algorithmImageV1)
            await deleteAlgorithm(algorithmName,true)
            
            
            
        }).timeout(1000 * 60 * 5);

        it('Delete  algorithim current version ', async () => {
        

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
    
   

});