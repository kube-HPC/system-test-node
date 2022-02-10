const chai = require('chai');
const path = require('path');
const chaiHttp = require('chai-http');
const config = require(path.join(process.cwd(), 'config/config'));

const expect = chai.expect;
const assertArrays = require('chai-arrays');


const execSync = require('child_process').execSync;
const {
    pipelineRandomName
   } = require(path.join(process.cwd(), 'utils/pipelineUtils'))

const {getRawGraph} = require(path.join(process.cwd(), 'utils/results'))
    

const {buildAlgorithmAndWait,
        runAlgGetResult,
        getAlgorithm, 
        deleteAlgorithm,
        buildGitAlgorithm,    
        getBuildList} = require(path.join(process.cwd(), 'utils/algorithmUtils'))

chai.use(chaiHttp);
chai.use(assertArrays);


const yaml = require('js-yaml');

const exceSyncString = async (command) =>{
    console.log("start- " + command)
    output = execSync(command);
    const noColor = output.toString('utf8').replace( /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');  
    console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")     
    console.log(noColor)
    console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")     
    return noColor

}

const  execSyncReturenJSON = async  (command)=>{
    
    const noColor= await exceSyncString(command)
    const  obj = yaml.load(noColor)
    const result = JSON.stringify(obj, null, 2)
   
    const jsonResult = JSON.parse(result)
  
    console.log("execSyncReturenJSON return typeof jsonResult = " +typeof jsonResult)
    return jsonResult
}

const createErrorAlg = async ()=>{
    if(!errorExsis){
        const code = path.join(process.cwd(), 'additionalFiles/pythonAlg/erroralg.zip');//pythonApi.tar.gz
        const entry = 'main'                     
        const pythonVersion = "python:3.7"                                    
        const buildStatusAlg = await buildAlgorithmAndWait({code:code, algName:"error-alg",entry:entry,baseVersion:pythonVersion})
        expect(buildStatusAlg.status).to.be.equal("completed") 
        errorExsis = true;
    }                        
}
describe('code api tests ', () => {
    
    after(async()=>{
        console.log("sater after")
        console.log("algList = "+ algLIst)
        const del = algLIst.map((e) =>{
            console.log("del"+e)
            return deleteAlgorithm(e) 
            
          })
         await Promise.all(del)

    })
    let algLIst = []
  

    describe("python code API",()=>{

        const algName = pipelineRandomName(8).toLowerCase();
        let algExsis = false
        const createAlg = async ()=>{
            if(!algExsis){
                const code = path.join(process.cwd(), 'additionalFiles/pythonAlg/pythonApi.tar.gz');//pythonApi.tar.gz
                const entry = 'main'                     
                const pythonVersion = "python:3.7"                                    
                const buildStatusAlg = await buildAlgorithmAndWait({code:code, algName:algName,entry:entry,baseVersion:pythonVersion})
                expect(buildStatusAlg.status).to.be.equal("completed") 
                algExsis = true;
                algLIst.push(algName)
            }                        
        }

       
        const getResultFromStorage = async (storagePath)=>{
            const res = await chai.request(config.apiServerUrl)
                    .get(`/storage/values/${storagePath}`)
            return res
        }

        it("start algorithm",async ()=>{
            await createAlg();
            const startAlg = [{
                action:"start_alg",
                name:"green-alg",
                input:["42"]
            }]
            const result = await runAlgGetResult(algName,startAlg)
            console.log(result)
            expect(result.data[0].result).to.be.equal(42)
            const graph = await getRawGraph(result.jobId)
            expect(graph.body.nodes.length).to.be.equal(2)
            

        }).timeout(1000 * 60 * 10)
    
            //error alg code:
            // def start(args, hkubeapi):
            //     if (len(args['input']) and args['input'][0].get('mem_fail')):
            //         print('allocate large memory')
            //         large_mem = b'\xdd'*1000*1000*1000
            //         print('after alloc')
            //     if (len(args['input']) and args['input'][0].get('error_fail')):
            //         print('error fail')
            //         raise ValueError('A very specific bad thing happened.')
            //         print('after alloc')


        it("start algorithm with mem error",async ()=>{
            await createAlg();
            const startAlg = [{
                action:"start_alg",
                name:"error-alg",
                input:[{
                    "mem_fail":true
                    }]
            }]
            const result = await runAlgGetResult(algName,startAlg)
            console.log(result)
           
        }).timeout(1000 * 60 * 10)

        it("start algorithm with alg error",async ()=>{
            
            const startAlg = [{
                action:"start_alg",
                name:"error-alg",
                input:[{
                    "error_fail":true
                    }]
            }]
            const result = await runAlgGetResult("python-code-api",startAlg)
            console.log(result)
           
        }).timeout(1000 * 60 * 10)
        it("sart stored pipeline",async ()=>{
                await createAlg();
                const startPipe = [{
                    "action":"start_stored_subpipeline",
                    "name":"simple",
                    "flowInput": {
                        "files": {
                            "link": "links-1"
                        }
                    }
                }]
                const result = await runAlgGetResult(algName,startPipe)
                
                expect(result.data[0].result.result).to.be.equal(42)
        }).timeout(1000 * 60 * 10)
const y = {
    "action":"start_stored_subpipeline",
    "name":"simple",
    "flowInput": {
        "files": {
            "link": "links-1"
        }
    }
}
        it("sart raw pipelien",async ()=>{
            await createAlg();
            const startRaw = [{
                action:"start_raw_subpipeline",
                name:"raw-simple",
                nodes:[  {
                    "nodeName": "one",
                    "algorithmName": "green-alg",
                    "input": []
                }
                
            ],
                flowInput: {}
            }]
            const result = await runAlgGetResult(algName,startRaw)
            console.log(result)
            expect(result.data[0].result[0].result).to.be.equal(42)
        }).timeout(1000 * 60 * 10)
    })


  

    describe("Java code API",()=>{
//buildGitAlgorithm({algName,gitUrl,gitKind ,entry , branch,language,  algorithmArray:algLIst})
        const algName = pipelineRandomName(8).toLowerCase();
        let algExsis = false
        const createAlg = async ()=>{
            if(!algExsis){
                const entry = 'javaApi'                
                const language = 'java'
                const gitUrl = "https://github.com/tamir321/hkubeJava.git"
                const branch = "master"
                const gitKind = "github"
                const buildStatusAlg = await buildGitAlgorithm({algName,gitUrl,gitKind ,entry , branch ,language })
                expect(buildStatusAlg.status).to.be.equal("completed") 
                algExsis = true;
                algLIst.push(algName)
            }
           
            

        }
        // const getResultFromStorage = async (storagePath)=>{
        //     const res = await chai.request(config.apiServerUrl)
        //             .get(`/storage/values/${storagePath}`)
        //     return res
        // }
const r = {
    "action":"startAlg",
    "algName":"green-alg",
    "alginput":["4"]
}
        it("Java sart algorithm",async ()=>{

            await createAlg();
            const startAlg = [{
                action:"startAlg",
                algName:"green-alg",
                alginput:["4"]
            }]
            const result = await runAlgGetResult(algName,startAlg)
            console.log(result)
            expect(result.data[0].result.response).to.be.equal(42)
            const graph = await getRawGraph(result.jobId)
            expect(graph.body.nodes.length).to.be.equal(2)
           

        }).timeout(1000 * 60 * 10)

        it("Java sart algorithm binary",async ()=>{
            //await createAlg();
            const startAlg = [{
                action:"startAlgBinary",
                algName:"green-alg",
                alginput:["4"]
            }]
            const result = await runAlgGetResult(algName,startAlg) //await runAlgGetResult(algName,startAlg)
            console.log(result)
            expect(result.data[0].result.response).to.be.equal(42)
            const graph = await getRawGraph(result.jobId)
            expect(graph.body.nodes.length).to.be.equal(2)
           

        }).timeout(1000 * 60 * 10)
        it("Java sart stored pipeline",async ()=>{
                await createAlg();
                const startPipe = [{
                    action:"startStored",
                    PipeName:"simple",
                    PipeInput: ["4"]
                }]
                const result = await runAlgGetResult(algName,startPipe)
                console.log(result)
               
               
                expect(result.data[0].result[0].result).to.be.equal(42)
        }).timeout(1000 * 60 * 10)

        it("Java sart raw pipelien",async ()=>{
            await createAlg();
            const startRaw = [{
                action:"startRaw",
                PipeName:"raw-simple"
                }
            ]
            const result = await runAlgGetResult(algName,startRaw)

            console.log(result)
               
               
            expect(result.data[0].result[0].result).to.be.equal(42)

            //const path = result.data[0].result.result.storageInfo.path
           // const res = await getResultFromStorage(path)
           
           // expect(res.body[0].result).to.be.equal(42)
        }).timeout(1000 * 60 * 10)
    })



    describe("Node JS  code API",()=>{

        const algName = pipelineRandomName(8).toLowerCase();
        let algExsis = false
        const createAlg = async ()=>{
            if(!algExsis){
                const entry = 'hkubeApi'                
                const language = 'nodejs'
                const gitUrl = "https://github.com/tamir321/hkube-js-algorithm.git"
                const branch = "main"
                const gitKind = "github"
                const buildStatusAlg = await buildGitAlgorithm({algName,gitUrl,gitKind ,entry , branch ,language })
                expect(buildStatusAlg.status).to.be.equal("completed") 
                algExsis = true;
                algLIst.push(algName)
            }
           
            

        }
    

        it("Node sart algorithm",async ()=>{
            await createAlg();
            const startAlg = [{"action":"startAlg","algName":"green-alg","input":[1]}]
            const result = await runAlgGetResult(algName,startAlg)
            console.log(result)
            expect(result.data[0].result).to.be.equal(42)
            const graph = await getRawGraph(result.jobId)
            expect(graph.body.nodes.length).to.be.equal(2)
           

        }).timeout(1000 * 60 * 10)

        it("Node sart stored pipeline",async ()=>{
                await createAlg();
                const startPipe = [{"action":"startStored","pipeName":"simple","input":{"inp":"5"}}]
                const result = await runAlgGetResult(algName,startPipe)
                console.log(result)
               
               
                expect(result.data[0].result[0].result).to.be.equal(42)
        }).timeout(1000 * 60 * 10)

        it("node sart raw pipelien",async ()=>{
             await createAlg();
            const startRaw = [{"action":"startRaw","pipeName":"raw",
              "pipNodes":"[{\"algorithmName\": \"green-alg\",\"input\": [\"@flowInput.bar\"],\"nodeName\": \"a\"},{\"algorithmName\": \"yellow-alg\",\"input\": [\"@a\"], \"nodeName\": \"b\"}]"
              ,"input":{"bar":{"size":"3","batch":"4"}}}
            ]
            const result = await runAlgGetResult(algName,startRaw)

            console.log(result)
               
               
            expect(result.data[0].result[0].result).to.be.equal(42)
         
        }).timeout(1000 * 60 * 10)
    })

   

});
