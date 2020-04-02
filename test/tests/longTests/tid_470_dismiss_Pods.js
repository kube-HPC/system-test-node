const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')



const {

    testData7
} = require(path.join(process.cwd(), 'config/index')).tid_400


const {
    getJobResult,
    getResult,
    getCronResult
} = require(path.join(process.cwd(), 'utils/results'))

const {
    getPiplineNodes,
    deletePipeline,
    storePipeline,
    runStored,
    deconstructTestData,
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))
chai.use(chaiHttp);

const {filterPodsByName} = require(path.join(process.cwd(), 'utils/kubeCtl'))


describe('TID-470 ~', () => {


  

 it("TID-470 - dismiss worker pods resources after completion of an algorithm and 10 minutes idel (git 120)", async () => {
    const beforEvalPods = await filterPodsByName("eval-alg")
    const d = deconstructTestData(testData7)
    const pipe = {   
        name: d.name,
        flowInput: {            
            inputs:[[10000,1],[10000,1],[10000,1],[10000,1],[10000,1]]               
        },            
        priority: 3
    }
    await deletePipeline(d)
    await storePipeline(d)
    const res = await runStored(pipe)
    await delay(15000)
    const pods = await getPiplineNodes(res.body.jobId)
    await getResult(res.body.jobId, 200)
   
    const evalPods = await filterPodsByName("eval-alg")
    await delay(11*60*1000)
    const afterEvalPods = await filterPodsByName("eval-alg")

    expect(evalPods.length).to.be.above(0)
    expect(afterEvalPods.length).to.be.equal(0)
 }).timeout(1000 * 60 * 15);





});