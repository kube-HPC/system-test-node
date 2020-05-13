const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')



const {
    testData1,
    testData2,
    testData3,
    testData4,
    testData4a,
    testData5,
    testData6,
    testData7,
    testData8
} = require(path.join(process.cwd(), 'config/index')).tid_400


const {
    getJobResult,
    getResult,
    getCronResult
} = require(path.join(process.cwd(), 'utils/results'))

const {
    getPiplineNodes,
    runStoredAndWaitForResults,
    pipelineRandomName,
    deletePipeline,
    storePipeline,
    runStored,
    deconstructTestData,
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))
chai.use(chaiHttp);

const {filterPodsByName} = require(path.join(process.cwd(), 'utils/kubeCtl'))
// const pipelineRandomName = (length)=>{
    
        
//         var result           = '';
//         var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//         var charactersLength = characters.length;
//         for ( var i = 0; i < length; i++ ) {
//            result += characters.charAt(Math.floor(Math.random() * charactersLength));
//         }
        
//         return result;
//     }

describe('TID-400 ~', () => {


    it("TID-400 many bytes put and get from object storage", async () => {
        //set test data to testData1
        const d = deconstructTestData(testData1)
        

        //store pipeline addmuldiv
        await storePipeline(d)
        const res = await runStored(d)
        const jobId = res.body.jobId
        const result = await getResult(jobId, 200)
        // let diff = []
        expect(result.data[0].result).to.be.equal(1000000)

    }).timeout(1000 * 60 * 5);

    describe('TID-410- different input types ~', () => {
        
        it(" integers", async () => {
            //set test data to testData1
            const d = deconstructTestData(testData2)
            await deletePipeline(d)
            const pipe = {   
                name: d.name,
                flowInput: {
                    addInput:[3,5],
                    multInput:[8]
                }
            }
           
            //store pipeline addmuldiv
            await storePipeline(d)
            const res = await runStored(pipe)
            const jobId = res.body.jobId
            const result = await getResult(jobId, 200)
            // let diff = []
            expect(result.data[0].result).to.be.equal(64)

        }).timeout(1000 * 60 * 5);


        it(" float", async () => {
            //set test data to testData1
            const d = deconstructTestData(testData2)
            await deletePipeline(d)
            const pipe = {   
                name: d.name,
                flowInput: {
                    addInput:[2.5,3.4],
                    multInput:[1.35]
                }
            }
           
            //store pipeline addmuldiv
            await storePipeline(d)
            const res = await runStored(pipe)
            const jobId = res.body.jobId
            const result = await getResult(jobId, 200)
            // let diff = []
            expect(result.data[0].result).to.be.closeTo(7.965,0.001)

        }).timeout(1000 * 60 * 5);


        it(" string", async () => {
            //set test data to testData1
            const d = deconstructTestData(testData5)
            await deletePipeline(d)
            const pipe = {   
                name: d.name,
                flowInput: {
                    inputs:["hello world","world","earth"]
                   
                }
            }
           
            //store pipeline addmuldiv
            await storePipeline(d)
            const res = await runStored(pipe)
            const jobId = res.body.jobId
            const result = await getResult(jobId, 200)
            // let diff = []
            expect(result.data[0].result).to.be.equal("hello earth")

        }).timeout(1000 * 60 * 5);


        it(" bool true", async () => {
            //set test data to testData1
            const d = deconstructTestData(testData3)
            await deletePipeline(d)
            const pipe = {   
                name: d.name,
                flowInput: {
                    inputs:true
                   
                }
            }
           
            //store pipeline addmuldiv
            await storePipeline(d)
            const res = await runStored(pipe)
            const jobId = res.body.jobId
            const result = await getResult(jobId, 200)
            // let diff = []
            expect(result.data[0].result).to.be.equal(true)

        }).timeout(1000 * 60 * 5);

        it(" bool false", async () => {
            //set test data to testData1
            const d = deconstructTestData(testData3)
            await deletePipeline(d)
            const pipe = {   
                name: d.name,
                flowInput: {
                    inputs:false
                   
                }
            }
           
            //store pipeline addmuldiv
            await storePipeline(d)
            const res = await runStored(pipe)
            const jobId = res.body.jobId
            const result = await getResult(jobId, 200)
            // let diff = []
            expect(result.data[0].result).to.be.equal(false)

        }).timeout(1000 * 60 * 5);

        // it.skip(" bool null", async () => {
        //     // bug https://app.zenhub.com/workspaces/hkube-5a1550823895aa68ea903c98/issues/kube-hpc/hkube/737
        //     //set test data to testData1
        //     const d = deconstructTestData(testData3)
        //     await deletePipeline(d)
        //     const pipe = {   
        //         name: d.name,
        //         flowInput: {
        //             inputs:null
                   
        //         }
        //     }
           
        //     //store pipeline addmuldiv
        //     await storePipeline(d)
        //     const res = await runStored(pipe)
        //     const jobId = res.body.jobId
        //     const result = await getResult(jobId, 200)
        //     // let diff = []
        //     expect(result.data[0].result).to.be.equal(null)

        // }).timeout(1000 * 60 * 5);


        it(" bool object type", async () => {
            //set test data to testData1
            const d = deconstructTestData(testData3)
            await deletePipeline(d)
            const pipe = {   
                name: d.name,
                flowInput: {
                    inputs:{
                        name:"hkube",
                        type:"type1",
                        prop:["prop1","prop2","prop3",4,7,89.022,-987]                        
                    }
                   
                }
            }
           
            //store pipeline addmuldiv
            await storePipeline(d)
            const res = await runStored(pipe)
            const jobId = res.body.jobId
            const result = await getResult(jobId, 200)
            // let diff = []
            expect(result.data[0].result).to.be.deep.equal(pipe.flowInput.inputs)

        }).timeout(1000 * 60 * 5);



})

it("TID-430- cron jobs (git 154 155)~", async () => {
   
    testData6.descriptor.name= pipelineRandomName(8)
    const d = deconstructTestData(testData6)
    await storePipeline(d)
    await delay(1000*60)
    for(i=0;i<4;i++){
        await delay(1000*60)
        const result =  await getCronResult(d.name,5)
        console.log("i="+i+" .result.body.length="+result.body.length)
        expect(result.body.length>=i).to.be.true
   }
   

   await deletePipeline(d)
}).timeout(1000 * 60 * 7);
// describe("TID-440 priority tests (git 58)~",()=>{
   
//     it('Different priority same Pipeline ', async () => {
//         const d = deconstructTestData(testData4)
//         const pipe = {   
//             name: d.name,
//             flowInput: {
//                 range:150,
//                 inputs:1000               
//             },            
//             priority: 3
//         }
//         await deletePipeline(d)
//         await storePipeline(d)
//         const res2 = await runStored(pipe)
//         await delay(2000)
//         pipe.priority = 1
//         const res1 = await runStored(pipe)
//         // write_log(res.body)
//         const jobId1 = res1.body.jobId
//         const jobId2 = res2.body.jobId
       
//         const result1 =  await getResult(jobId1, 200)
//         const result2 = await  getResult(jobId2, 200)
//         expect(result1.timeTook).to.be.lessThan(result2.timeTook)
//     }).timeout(1000 * 60 * 2)


//     it('Different priority Pipelines with Different algorithm', async () => {
//         const testDataA = testData4a
//         const d = deconstructTestData(testData4a)
//         await deletePipeline(d)
//         await storePipeline(d)
//         const pipe = {   
//             name: d.name,
//             flowInput: {
//                 range:600,
//                 inputs:4000               
//             },            
//             priority: 3
//         }
//         testData4a.descriptor.name= testData4a.descriptor.name+"2"
//         const d2 = deconstructTestData(testDataA)
//         d2.pipeline.nodes[0].algorithmName=d2.pipeline.nodes[1].algorithmName="eval-alg2"
//         await deletePipeline(d2)
//         await storePipeline(d2)
//         const res2 = await runStored(pipe)
//         await delay(5000)
//         pipe.name= d2.name
//         pipe.priority = 1
//         const res1 = await runStored(pipe)
//         // write_log(res.body)
//         const jobId1 = res1.body.jobId
//         const jobId2 = res2.body.jobId
       
//         const result1 =  await getResult(jobId1, 200)
//         const result2 = await  getResult(jobId2, 200)
//         expect(result1.timeTook).to.be.lessThan(result2.timeTook)
//     }).timeout(1000 * 60 * 15)


//     it('Same priority pipelines different batch sizes ', async () => {
//         const d = deconstructTestData(testData4)
//         const pipe = {   
//             name: d.name,
//             flowInput: {
//                 range:500,
//                 inputs:1000               
//             },            
//             priority: 3
//         }
//         await deletePipeline(d)
//         await storePipeline(d)
//         const res2 = await runStored(pipe)
//         await delay(1000)
//         pipe.flowInput.range = 100
//         const res1 = await runStored(pipe)
//         // write_log(res.body)
//         const jobId1 = res1.body.jobId
//         const jobId2 = res2.body.jobId
       
//         const result1 =  await getResult(jobId1, 200)
//         const result2 = await  getResult(jobId2, 200)
//         expect(result1.timeTook).to.be.lessThan(result2.timeTook)
//     }).timeout(1000 * 60 * 7)
// })



it("TID-460 - algorithm statuses ~", async () => {

    const d = deconstructTestData(testData8)
    await deletePipeline(d)
    await storePipeline(d)
    const jobId = await runStoredAndWaitForResults(d)
    const res = await getJobResult(jobId)
    expect(res.body.data[1].error).includes("Error: failed to eval code");

}).timeout(1000 * 60 * 7);


 it("TID-470- dismiss resources after completion of an algorithm (git 120)", async () => {
    const beforEvalPods = await filterPodsByName("eval-alg")
    const d = deconstructTestData(testData7)
    const pipe = {   
        name: d.name,
        flowInput: {            
            inputs:[[30000,1],[30000,1],[30000,1],[30000,1],[30000,1]]               
        },            
        priority: 3
    }
    await deletePipeline(d)
    await storePipeline(d)
    const res = await runStored(pipe)
    await delay(15000)
    const pods = await getPiplineNodes(res.body.jobId)
    await getResult(res.body.jobId, 200)
    const res2 = await runStored(pipe)
    await delay(15000)
    const pods2 = await getPiplineNodes(res2.body.jobId)


    const evalPods = await filterPodsByName("eval-alg")
    await delay(3*60*1000)
    const evalPods2 = await filterPodsByName("eval-alg")

    const afterPods = await getPiplineNodes(res.body.jobId)
    const afterPods2 = await getPiplineNodes(res2.body.jobId)
    expect(pods.body.length).to.be.equal(5)
    expect(pods2.body.length).to.be.equal(5)
    expect(afterPods.body.length).to.be.equal(0)
    expect(afterPods2.body.length).to.be.equal(0)
 }).timeout(1000 * 60 * 8);


// it.skip("TID-490 pipeline options", async () => {

   

// }).timeout(1000 * 60 * 7);


});