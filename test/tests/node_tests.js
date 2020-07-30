const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay');
const { pipe } = require('winston-daily-rotate-file');
var diff = require('deep-diff').diff

const { runAlgorithm,
        deleteAlgorithm,
        storeAlgorithm,
        getAlgorithm,    
        getAlgorithmVersion,
        updateAlgorithmVersion,
        buildAlgoFromImage,
        deleteAlgorithmVersion,
        getAlgorithim} = require(path.join(process.cwd(), 'utils/algorithmUtils'))

const { 
    getWebSocketJobs,
    getWebSocketlogs,
    getDriverIdByJobId
        } = require(path.join(process.cwd(), 'utils/socketGet'))

const {   
    testData1,
    testData2,
   
} = require(path.join(process.cwd(), 'config/index')).pipelineTest


const {
  getRawGraph,
    getResult
  } = require(path.join(process.cwd(), 'utils/results'))

// const KubernetesClient = require('@hkube/kubernetes-client').Client;
const {pipelineRandomName,  
      runRaw,
      exceCachPipeline} = require(path.join(process.cwd(), 'utils/pipelineUtils'))

chai.use(chaiHttp);



describe('Node Tests git 660', () => {
  
    describe('singel node batch input' , () => {
        const pipe ={
            name: "Athos-Cartesian",
            nodes: [
                {
                    nodeName: "one",
                    algorithmName: "eval-alg",
                    input: [1],
                    batchOperation: "indexed" //cartesian
                }
            ]
        }
       
        it('singel batch indexed', async () => {
          pipe.nodes[0].input = [ "#[0...10]"]
          const res = await runRaw(pipe)
          const jobId = res.body.jobId
          const result = await  getResult(jobId,200) 
          expect(result.data.length).to.be.equal(10)
        }).timeout(1000 * 60 * 2)


        it('two batch indexed python', async () => {
            pipe.nodes[0].input = [ "add",
                                    "#[0...10]",
                                    "#[10,20,30]"]
            pipe.nodes[0].algorithmName = "eval-alg"
            const res = await runRaw(pipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200) 
            expect(result.data.length).to.be.equal(10)
          }).timeout(1000 * 60 * 2)


        
          it('two batch indexed  ', async () => {
            pipe.nodes[0].input = [ "#[0...10]",
                                    "#[10,20,30]"]
            const res = await runRaw(pipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200) 
            expect(result.data.length).to.be.equal(10)
          }).timeout(1000 * 60 * 2)

           
          it('two batch one object  indexed', async () => {
            pipe.nodes[0].input = [ {"data":"stam"},
                                    "#[0...10]",
                                    "#[10,20,30]"]
            pipe.nodes[0].batchOperation ="indexed"
            const res = await runRaw(pipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200) 
            expect(result.data.length).to.be.equal(10)
          }).timeout(1000 * 60 * 2)

          it('singel batch cartesian', async () => {
            pipe.nodes[0].input = [ "#[0...10]"]
            pipe.nodes[0].batchOperation ="cartesian"
            const res = await runRaw(pipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200) 
            expect(result.data.length).to.be.equal(10)
          }).timeout(1000 * 60 * 2)
          
        it('two batch cartesian', async () => {
            pipe.nodes[0].input = [ "#[0...10]",
                                    "#[10,20,30]"]
            pipe.nodes[0].batchOperation ="cartesian"
            const res = await runRaw(pipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200) 
            expect(result.data.length).to.be.equal(30)
          }).timeout(1000 * 60 * 2);

          
          it('two batch one object  cartesian', async () => {
            pipe.nodes[0].input = [ {"data":"stam"},
                                    "#[0...10]",
                                    "#[10,20,30]"]
            pipe.nodes[0].batchOperation ="cartesian"
            const res = await runRaw(pipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200) 
            expect(result.data.length).to.be.equal(30)
          }).timeout(1000 * 60 * 2)

          it('two batch two object  cartesian', async () => {
            pipe.nodes[0].input = [  {"date":"now"},
                                    {"data":"stam"},
                                    "#[0...10]",
                                    "#[10,20,30]"]
            pipe.nodes[0].batchOperation ="cartesian"
            const res = await runRaw(pipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200) 
            console.log(result.data.length)
            console.log(result.data[0].result)
            expect(result.data.length).to.be.equal(30)
            
            expect(result.data[0].result.length).to.be.equal(4)
          }).timeout(1000 * 60 * 2)


    })


    describe('pipe line batch input' , () => {
        const pipe ={
            name: "Athos-Cartesian",
            nodes: [
                {
                    nodeName: "one",
                    algorithmName: "eval-alg",
                    input: [1],
                   
                },
                {
                    nodeName: "two",
                    algorithmName: "eval-alg",
                    input: ["#@one"],
                  
                },
                {
                    nodeName: "three",
                    algorithmName: "eval-alg",
                    input: ["#@one","#@two"],
                    batchOperation: "indexed" //cartesian
                }
            ]
        }
       
        it(' batch indexed', async () => {
          pipe.nodes[0].input =  [ "#[0...10]"]
          pipe.nodes[1].input =[ "#[10...20]"]
          const res = await runRaw(pipe)
          const jobId = res.body.jobId
          const result = await  getResult(jobId,200) 
          expect(result.data.length).to.be.equal(10)
          expect(JSON.stringify(result.data[7].result)).to.be.equal(JSON.stringify([[7],[17]]))
        }).timeout(1000 * 60 * 2)

        it(' batch cartesian', async () => {
            pipe.nodes[0].input = [ "#[0...10]"]
            pipe.nodes[1].input = [ "#[10...15]"]
            pipe.nodes[2].input = [ "#@one","#@two"]
            pipe.nodes[2].batchOperation = "cartesian"
            const res = await runRaw(pipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200) 
            expect(result.data.length).to.be.equal(50)
            expect(JSON.stringify(result.data[37].result)).to.be.equal(JSON.stringify([[7],[12]]))
            expect(JSON.stringify(result.data[49].result)).to.be.equal(JSON.stringify([[9],[14]]))
          }).timeout(1000 * 60 * 2)

          it(' batch + fix cartesian', async () => {
            pipe.nodes[0].input = [ "#[0...10]"]
            pipe.nodes[1].input = [ "#[10...15]"]
            pipe.nodes[2].input = [ "99","#@one","#@two"]
            pipe.nodes[2].batchOperation = "cartesian"
            const res = await runRaw(pipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200) 
            expect(result.data.length).to.be.equal(50)
            console.log(result.data[37].result)
            expect(JSON.stringify(result.data[37].result)).to.be.equal(JSON.stringify(["99",[7],[12]]))
            expect(JSON.stringify(result.data[49].result)).to.be.equal(JSON.stringify(["99",[9],[14]]))
          }).timeout(1000 * 60 * 2)

          it(' batch + fix indexed', async () => {
            pipe.nodes[0].input = [ "#[0...10]"]
            pipe.nodes[1].input = [ "#[10...15]"]
            pipe.nodes[2].input = [ "99","#@one","#@two"]
            pipe.nodes[2].batchOperation = "indexed"
            const res = await runRaw(pipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200) 
            expect(result.data.length).to.be.equal(10)
            expect(JSON.stringify(result.data[7].result)).to.be.equal(JSON.stringify(["99",[7],null]))
            expect(JSON.stringify(result.data[4].result)).to.be.equal(JSON.stringify(["99",[4],[14]]))
          }).timeout(1000 * 60 * 2)


          it('any on batch', async () => {
            pipe.nodes[0].input = [ "#[0...10]"]
            pipe.nodes[1].input = [ "#[10...15]"]
            pipe.nodes[2].input = ["*@one","#@two"]
            pipe.nodes[2].batchOperation = "indexed"
            const res = await runRaw(pipe)
            const jobId = res.body.jobId
            const result = await  getResult(jobId,200) 
            expect(result.data.length).to.be.equal(50)


            // console.log(JSON.stringify(result.data[37].result))        
            // console.log(JSON.stringify(result.data[49].result))          
            // expect(JSON.stringify(result.data[37].result)).to.be.equal(JSON.stringify([[7],[12]]))
            // expect(JSON.stringify(result.data[49].result)).to.be.equal(JSON.stringify([[9],[14]]))
          }).timeout(1000 * 60 * 2)
    })
    


    describe('pipe flowInput line batch input' , () => {
      const pipe ={
          name: "Athos-Cartesian",
          nodes: [
              {
                  nodeName: "one",
                  algorithmName: "eval-alg",
                  input: ["#@flowInput.one"]
                 
              },
              {
                  nodeName: "two",
                  algorithmName: "eval-alg",
                  input: ["#@flowInput.two"],
                
              },
              {
                  nodeName: "three",
                  algorithmName: "eval-alg",
                  input: ["#@one","#@two"],
                  batchOperation: "indexed" //cartesian
              }
          ],
          flowInput:{}

      }
     
      it('flowInput batch cartesian', async () => {
        pipe.nodes[0].input = ["#@flowInput.one","#@flowInput.two"]
        pipe.nodes[0].batchOperation = "cartesian"
        pipe.nodes[2].batchOperation = "cartesian"
        pipe.flowInput.one = [0,1,2,3,4,5,6,7,8,9]
        pipe.flowInput.two = [10,11,12,13,14,15,16,17,18,19]
        const res = await runRaw(pipe)
        const jobId = res.body.jobId
        const result = await  getResult(jobId,200) 
        expect(result.data.length).to.be.equal(1000)
        expect(JSON.stringify(result.data[999].result)).to.be.equal(JSON.stringify([[9,19],[19]]))
        expect(JSON.stringify(result.data[17].result)).to.be.equal(JSON.stringify([[0,11],[17]]))
      }).timeout(1000 * 60 * 2)

      it(' flowInput batch index', async () => {
        pipe.nodes[0].input = ["#@flowInput.one","#@flowInput.two"]
        pipe.nodes[0].batchOperation = "cartesian"
        pipe.nodes[2].batchOperation = "indexed"
        pipe.flowInput.one = [0,1,2,3,4,5,6,7,8,9]
        pipe.flowInput.two = [10,11,12,13,14,15,16,17,18,19]
        const res = await runRaw(pipe)
        const jobId = res.body.jobId
        const result = await  getResult(jobId,200) 
        expect(result.data.length).to.be.equal(100)
        expect(JSON.stringify(result.data[99].result)).to.be.equal(JSON.stringify([[9,19],null]))
        expect(JSON.stringify(result.data[9].result)).to.be.equal(JSON.stringify([[0,19],[19]]))
        }).timeout(1000 * 60 * 2)

        it('flowInput batch +any ', async () => {
          pipe.nodes[0].input = ["#@flowInput.one","#@flowInput.two"]
          pipe.nodes[0].batchOperation = "cartesian"
          pipe.nodes[2].input = ["*@one","#@two"]
          pipe.nodes[2].batchOperation = "cartesian"
          pipe.flowInput.one = [0,1,2,3,4,5,6,7,8,9]
          pipe.flowInput.two = [10,11,12,13,14,15,16,17,18,19]
          const res = await runRaw(pipe)
          const jobId = res.body.jobId
          const result = await  getResult(jobId,200) 
        
          expect(result.data.length).to.be.equal(1000)
        //  expect(JSON.stringify(result.data[99].result)).to.be.equal("[[0,19],[19]]")
        }).timeout(1000 * 60 * 2)

        it('a batch + fix indexed', async () => {
          pipe.nodes[0].input = [ "#[0...10]"]
          pipe.nodes[1].input = [ "#[10...15]"]
          pipe.nodes[2].input = [ "99","#@one","#@two"]
          pipe.nodes[2].batchOperation = "indexed"
          const res = await runRaw(pipe)
          const jobId = res.body.jobId
          const result = await  getResult(jobId,200) 
          expect(result.data.length).to.be.equal(10)
          expect(JSON.stringify(result.data[7].result)).to.be.equal(JSON.stringify(["99",[7],null]))
          expect(JSON.stringify(result.data[4].result)).to.be.equal(JSON.stringify(["99",[4],[14]]))
        }).timeout(1000 * 60 * 2)


        it('custom input', async () => {
          pipe.nodes[0].input = [ "#[0...10]"]
          pipe.nodes[1].input = [ "#[10...20]"]
          pipe.nodes[2].input = [ {"a":"@one","b":"@two"}]
          pipe.nodes[2].batchOperation = "indexed"
          const res = await runRaw(pipe)
          const jobId = res.body.jobId
          const result = await  getResult(jobId,200) 
          expect(result.data.length).to.be.equal(1)
          expect(result.data[0].result[0].a.length).to.be.equal(10)
          expect(result.data[0].result[0].b.length).to.be.equal(10)

        }).timeout(1000 * 60 * 2)


        it('flowInput = null', async () => {
          
          pipe.nodes[0].input = ["#@flowInput.one","#@flowInput.two"]
          pipe.nodes[0].batchOperation = "cartesian"
          pipe.nodes[2].input = ["#@one","#@two"]
        
          pipe.flowInput.one = null
          pipe.flowInput.two = [0,1,2,3,4,5,6,7,8,9]
          const res = await runRaw(pipe)
          const jobId = res.body.jobId
          const result = await  getResult(jobId,200) 
         
        }).timeout(1000 * 60 * 2)



        it('caching (Run Node) batch index ',async ()=>{
          pipe.nodes[0].input = ["#@flowInput.one","#@flowInput.two"]
          pipe.nodes[0].batchOperation = "cartesian"
          pipe.nodes[2].input = ["#@one","#@two"]
          pipe.nodes[2].batchOperation = "indexed"
          pipe.flowInput.one = [0,1,2,3,4,5,6,7,8,9]
          pipe.flowInput.two = [10,11,12,13,14,15,16,17,18,19]
          const res = await runRaw(pipe)
          const jobId = res.body.jobId
          const orgRes = await  getResult(jobId,200) 

          const res2 = await exceCachPipeline(jobId,"three")
          const jobId2 = res2.body.jobId
          const cachRes = await getResult(jobId2, 200)

          expect(JSON.stringify(orgRes.data)==JSON.stringify(cachRes.data)).to.be.true 
        }).timeout(1000 * 60 * 2)

        it('caching (Run Node) flowInput batch cartesian', async () => {
          pipe.nodes[0].input = ["#@flowInput.one","#@flowInput.two"]
          pipe.nodes[0].batchOperation = "cartesian"
          pipe.nodes[2].batchOperation = "cartesian"
          pipe.flowInput.one = [0,1,2,3,4,5,6,7,8,9]
          pipe.flowInput.two = [10,11,12,13,14,15,16,17,18,19]
          const res = await runRaw(pipe)
          const jobId = res.body.jobId
          const orgRes = await  getResult(jobId,200) 
          const res2 = await exceCachPipeline(jobId,"three")
          const jobId2 = res2.body.jobId
          const cachRes = await getResult(jobId2, 200)

          expect(JSON.stringify(orgRes.data)==JSON.stringify(cachRes.data)).to.be.true 
        }).timeout(1000 * 60 * 2)
        it('caching (Run Node) batch + fix indexed', async () => {
          pipe.nodes[0].input = [ "#[0...10]"]
          pipe.nodes[1].input = [ "#[10...15]"]
          pipe.nodes[2].input = [ "99","#@one","#@two"]
          pipe.nodes[2].batchOperation = "indexed"
          const res = await runRaw(pipe)
          const jobId = res.body.jobId
          const orgRes = await  getResult(jobId,200) 
          const res2 = await exceCachPipeline(jobId,"three")
          const jobId2 = res2.body.jobId
          const cachRes = await getResult(jobId2, 200)

          expect(JSON.stringify(orgRes.data)==JSON.stringify(cachRes.data)).to.be.true 
        }).timeout(1000 * 60 * 2)
        it('caching (Run Node) batch +any ',async ()=>{
          pipe.nodes[0].input = ["#@flowInput.one","#@flowInput.two"]
          pipe.nodes[0].batchOperation = "cartesian"
          pipe.nodes[2].input = ["*@one","#@two"]
          pipe.nodes[2].batchOperation = "cartesian"
          pipe.flowInput.one = [0,1,2,3,4,5,6,7,8,9]
          pipe.flowInput.two = [10,11,12,13,14,15,16,17,18,19]
          const res = await runRaw(pipe)
          const jobId = res.body.jobId
          const orgRes = await  getResult(jobId,200) 

          const res2 = await exceCachPipeline(jobId,"three")
          expect(res2.status).to.be.equal(400)
          expect(res2.body.error.message).to.be.equal("relation waitAny for node three is not allowed")
         
         

        }).timeout(1000 * 60 * 2)


        it('caching (Run Node) on cached pipeline ',async ()=>{
          pipe.nodes[0].input = ["#@flowInput.one","#@flowInput.two"]
          pipe.nodes[0].batchOperation = "cartesian"
          pipe.nodes[1].input = ["#@one"]
          pipe.nodes[2].input = ["#@two"]
         
          pipe.flowInput.one = [0,1,2,3,4,5,6,7,8,9]
          pipe.flowInput.two = [10,11,12,13,14,15,16,17,18,19]
          const res = await runRaw(pipe)
          const jobId = res.body.jobId
          const orgRes =await  getResult(jobId,200) 

          const res2 = await exceCachPipeline(jobId,"two")
          const jobId2 = res2.body.jobId
          await getResult(jobId2, 200)


          const res3 = await exceCachPipeline(jobId2,"three")
          const jobId3 = res3.body.jobId
          const cachRes = await getResult(jobId3, 200)

          expect(JSON.stringify(orgRes.data)==JSON.stringify(cachRes.data)).to.be.true 
        }).timeout(1000 * 60 * 2)
  })

  describe("Fail schdualing",()=>{
    const algName= pipelineRandomName(8).toLowerCase()    
    const alg15cpu = { "name": `${algName}`,
                        "algorithmImage": "hkube/algorunner",
                        "cpu": 15,
                        "mem": "1Gi",
                        "options": {
                            "debug": false,
                            "pending": false
                        },
                        "minHotWorkers": 0,
                        "type": "Image"}
                    
   
    it("node Fail schdualing due to lack of resource",async ()=>{    
            await buildAlgoFromImage(alg15cpu);
            const alg = {name: algName,
                        input:[]}
            const res = await runAlgorithm(alg);
            await delay(30000);
            const graph = await getRawGraph(res.body.jobId)
            await deleteAlgorithm(algName)
            expect(graph.body.nodes[0].status).to.be.equal('FailedScheduling')
          }).timeout(1000 * 60 * 2)
  })
});