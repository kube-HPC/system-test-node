const chai = require('chai');
const expect = chai.expect;
const path = require('path');
const config = require(path.join(process.cwd(), 'config/config'));
const chaiHttp = require('chai-http');
const assertArrays = require('chai-arrays');
const fs = require('fs');
const {
    write_log
} = require(path.join(process.cwd(), 'utils/misc_utils'))
const fse = require('fs')


const delay = require('delay');

const {
    getResult,
    getStatusall,
    idGen,
    runRaw,
    getRawGraph,
    getParsedGraph } = require(path.join(process.cwd(), 'utils/results'))
const {
    pipelineRandomName} = require(path.join(process.cwd(), 'utils/pipelineUtils'))
const {
    runAlgGetResult,
    runAlgorithm,
    getAlgorithm,
    deleteAlgorithm,    
    getAlgorithmVersion,
    updateAlgorithmVersion,
    storeAlgorithmApplay,
    deleteAlgorithmVersion,
    buildAlgorithmAndWait,
    buildAlgorithm,
    buildGitAlgorithm,    
    getAlgorithim,
    stopBuild,
    rerunBuild} = require(path.join(process.cwd(), 'utils/algorithmUtils'))

    const {getWebSocketData} = require(path.join(process.cwd(), 'utils/socketGet'))

chai.use(chaiHttp);

chai.use(assertArrays);

describe('Algorithm build test', () => {
    let algLIst = []
    
    after(async function() {
        this.timeout(2*60*1000);
        console.log("sater after")
        console.log("algList = "+ algLIst)
        j = 0
        z = 3
        
        while (j < algLIst.length){
            delAlg = algLIst.slice(j,z)
            const del = delAlg.map((e) =>{
                return deleteAlgorithm(e)       
              })
            console.log("delAlg-"+delAlg)
            const delResult  = await Promise.all(del)
            console.log("delResult-"+delResult)
            await delay(2000)
             j +=3
             z +=3
             console.log("j="+j+",z="+z)
        }


           console.log("end -----")  
           
    })

  

   

    describe('python version test', () => {
        const code1 = path.join(process.cwd(), 'additionalFiles/python.versions.tar.gz');
        
    
        it(`python 2.7`, async () => {
            const entry = 'main27'
            const algName= pipelineRandomName(8).toLowerCase()    
            const pythonVersion = "python:2.7"                    
            
            const buildStatusAlg = await buildAlgorithmAndWait({code:code1, algName:algName,entry:entry,baseVersion:pythonVersion,algorithmArray:algLIst})
            expect(buildStatusAlg.status).to.be.equal("completed") 
            const result = await runAlgGetResult(algName,[4])
            await deleteAlgorithm(algName,true)    
            expect(result.data[0].result.sysVersion.toString()).to.be.equal("2")  
        }).timeout(1000 * 60 * 20)

        it.skip(`python 3.5`, async () => {
            const entry = 'main35'
            const algName= pipelineRandomName(8).toLowerCase()    
            const pythonVersion = "python:3.5"                    
            
            const buildStatusAlg = await buildAlgorithmAndWait({code:code1, algName:algName,entry:entry,baseVersion:pythonVersion,algorithmArray:algLIst})
            expect(buildStatusAlg.status).to.be.equal("completed") 
            const result = await runAlgGetResult(algName,[4])
            await deleteAlgorithm(algName,true)    
            expect(result.data[0].result.sysVersion.toString()).to.be.equal("3,5,10,final,0")    
        }).timeout(1000 * 60 * 20)


        it(`python 3.6`, async () => {
            const entry = 'main36'
            const algName= pipelineRandomName(8).toLowerCase()    
            const pythonVersion = "python:3.6"                    
            
            const buildStatusAlg = await buildAlgorithmAndWait({code:code1, algName:algName,entry:entry,baseVersion:pythonVersion,algorithmArray:algLIst})
            expect(buildStatusAlg.status).to.be.equal("completed") 
            const result = await runAlgGetResult(algName,[4])
            await deleteAlgorithm(algName,true)    
            expect(result.data[0].result.sysVersion.toString()).to.be.equal("3,6,13,final,0")  
        }).timeout(1000 * 60 * 20)

        it(`python 3.7`, async () => {
            const entry = 'main37'
            const algName= pipelineRandomName(8).toLowerCase()    
            const pythonVersion = "python:3.7"                    
            
            const buildStatusAlg = await buildAlgorithmAndWait({code:code1, algName:algName,entry:entry,baseVersion:pythonVersion,algorithmArray:algLIst})
            expect(buildStatusAlg.status).to.be.equal("completed") 
            const result = await runAlgGetResult(algName,[4])
            await deleteAlgorithm(algName,true)    
            expect(result.data[0].result.sysVersion.toString()).to.be.equal("3,7,10,final,0")  
        }).timeout(1000 * 60 * 20)

        it(`python 3.7-slim`, async () => {
            const entry = 'main37slim'
            const algName= pipelineRandomName(8).toLowerCase()    
            const pythonVersion = "python:3.7-slim"                    
            
            const buildStatusAlg = await buildAlgorithmAndWait({code:code1, algName:algName,entry:entry,baseVersion:pythonVersion,algorithmArray:algLIst})
            expect(buildStatusAlg.status).to.be.equal("completed") 
            const result = await runAlgGetResult(algName,[4])
            await deleteAlgorithm(algName,true)    
            expect(result.data[0].result.sysVersion.toString()).to.be.equal("3,7,10,final,0")   
        }).timeout(1000 * 60 * 20)

        const getBuildStates = async (jobId) => {
            const res = await chai.request(config.apiServerUrl)
                .get(`/builds/status/${jobId}`);
            return res.body.status
        
        }


        it('stop rerun build',async ()=>{
            const entry = 'main37'
            const algName= pipelineRandomName(8).toLowerCase()    
            const pythonVersion = "python:3.7"                    
            
            const buildId = await buildAlgorithm({code:code1, algName:algName,entry:entry,baseVersion:pythonVersion,algorithmArray:algLIst})
            await delay(30000)
            const res =await stopBuild(buildId)
            await delay(10000)
            const status = await getBuildStates(buildId)
            expect(status).to.be.equal("stopped")
            const rerun = await rerunBuild(buildId)
            await delay(50000)
            let rereunStatus = await getBuildStates(buildId)
            await deleteAlgorithm(algName,true)
            expect(rereunStatus).to.be.equal("active")
           
        }).timeout(1000 * 60 * 5)
})

describe('Algorithm requirements repository (git 387)', () => {
    

    it(`python with requirements - tensore`, async () => {
        const code = path.join(process.cwd(), 'additionalFiles/tensor.tar.gz');
        const entry = 'main'
        const algName= pipelineRandomName(8).toLowerCase()    
        //const pythonVersion = "python:3.6"                    
        
        const data = {
            name: algName,
            env: 'python',
            cpu: 1,
            gpu: 0,
            mem: '5Gi',
            entryPoint: entry,
            minHotWorkers: 0,
            version: idGen()//,
            //baseImage:pythonVersion
        }
    
        const res = await chai.request(config.apiServerUrl)
            .post('/store/algorithms/apply')
            .field('payload', JSON.stringify(data))
            .attach('file', fse.readFileSync(code), entry)
    
      
    
        // res.should.have.status(200)
        expect(res.status).to.eql(200)
        const buildIdAlg = res.body.buildId
        const buildStatusAlg = await getStatusall(buildIdAlg, `/builds/status/`, 200, "completed", 1000 * 60 * 10)

        expect(buildStatusAlg.status).to.be.equal("completed") 
        const result = await runAlgGetResult(algName,[4])
        await deleteAlgorithm(algName,true)    
        expect(result.status).to.be.equal("completed")  
    }).timeout(1000 * 60 * 20)


    it(`nodejs with requirements - lodash`, async () => {
        const code = path.join(process.cwd(), 'additionalFiles/sortAlg.tar.gz');
        const entry = 'algorithm.js'
        const algName= pipelineRandomName(8).toLowerCase()    
      
        
        const data = {
            name: algName,
            env: 'nodejs',
            cpu: 1,
            gpu: 0,
            mem: '256Mi',
            entryPoint: entry,
            minHotWorkers: 0,

        }
    
        const res = await chai.request(config.apiServerUrl)
            .post('/store/algorithms/apply')
            .field('payload', JSON.stringify(data))
            .attach('file', fse.readFileSync(code), entry)
    

        expect(res.status).to.eql(200)
        const buildIdAlg = res.body.buildId
        const buildStatusAlg = await getStatusall(buildIdAlg, `/builds/status/`, 200, "completed", 1000 * 60 * 10)

        expect(buildStatusAlg.status).to.be.equal("completed") 
        // the algorith sort object by the order  ["user", "age"]
        const result = await runAlgGetResult(algName,[
                [
                      { "user": "fred",   "age": 48 },
                      { "user": "barney", "age": 34 },
                      { "user": "fred",   "age": 40 },
                      { "user": "barney", "age": 36 }
                  ],
                  ["user", "age"]
                ]
        )
        await deleteAlgorithm(algName,true)    
        expect(result.data[0].result.result.sorted[0].user).to.be.equal("barney")
        expect(result.data[0].result.result.sorted[0].age).to.be.equal(34)
        expect(result.status).to.be.equal("completed")  
    }).timeout(1000 * 60 * 20)



})


describe('git hub and git lab algorithm builds (git 506)', () => {
    it("build github master algorithm",async ()=>{
        const entry = 'main'
        const algName= pipelineRandomName(8).toLowerCase()    
        const language = 'python'
        const gitUrl = "https://github.com/tamir321/hkube.git"
        const branch = "master"
        const gitKind = "github"
        const buildStatusAlg = await buildGitAlgorithm({algName,gitUrl,gitKind ,entry , branch,language,  algorithmArray:algLIst})
        expect(buildStatusAlg.status).to.be.equal("completed") 
        const result = await runAlgGetResult(algName,[4])
        await deleteAlgorithm(algName,true)
        expect(result.data[0].result.version).to.be.equal("master margev1") 
        expect(result.data[0].result.commit).to.be.equal("A6")                  
    }).timeout(1000 * 60 * 20)

    it("build github master algorithm java",async ()=>{
        const entry = 'Algorithm'
        const algName= pipelineRandomName(8).toLowerCase()    
        const language = 'java'
        const gitUrl = "https://github.com/tamir321/hkubeJava.git"
        const branch = "master"
        const gitKind = "github"
        const buildStatusAlg = await buildGitAlgorithm({algName,gitUrl,gitKind ,entry , branch ,language ,algorithmArray:algLIst})
        expect(buildStatusAlg.status).to.be.equal("completed") 
        const result = await runAlgGetResult(algName,[4,3,2,1])
        await deleteAlgorithm(algName,true)
        expect(result.data[0].result.data.myAnswer).to.be.equal(33) 
        expect(result.data[0].result.files.link).to.be.equal("mylink")     
      
       
    }).timeout(1000 * 60 * 20)


    it("build github branch algorithm",async ()=>{
        const entry = 'main'
        const algName= pipelineRandomName(8).toLowerCase()    

        const gitUrl = "https://github.com/tamir321/hkube.git"
        const branch = "branch2"
        const gitKind = "github"
        const buildStatusAlg = await buildGitAlgorithm({algName,gitUrl,gitKind ,entry , branch  ,algorithmArray:algLIst})
        expect(buildStatusAlg.status).to.be.equal("completed") 
        const result = await runAlgGetResult(algName,[4])
        await deleteAlgorithm(algName,true)    
        expect(result.data[0].result.version).to.be.equal("new branch2-v1")   
        //result.data[0].result.version  =  "new branch2-v1"
       
    }).timeout(1000 * 60 * 20)


    it("build gitlab master algorithm",async ()=>{
        const entry = 'main'
        const algName= pipelineRandomName(8).toLowerCase()    

        const gitUrl = "https://gitlab.com/tamir321/hkube.git"
        const branch = "master"
        const gitKind = "gitlab"
        const buildStatusAlg = await buildGitAlgorithm({algName,gitUrl,gitKind ,entry , branch  ,algorithmArray:algLIst})
        expect(buildStatusAlg.status).to.be.equal("completed") 
        const result = await runAlgGetResult(algName,[4])
        await deleteAlgorithm(algName,true)
        expect(result.data[0].result.version).to.be.equal("gitlab master")     
       
       
    }).timeout(1000 * 60 * 20)


    it("build gitlat branch algorithm",async ()=>{
        const entry = 'main.py'
        const algName= pipelineRandomName(8).toLowerCase()    

        const gitUrl = "https://gitlab.com/tamir321/hkube.git"
        const branch = "branch1"
        const gitKind = "gitlab"
        const buildStatusAlg = await buildGitAlgorithm({algName,gitUrl,gitKind ,entry , branch  ,algorithmArray:algLIst})
        expect(buildStatusAlg.status).to.be.equal("completed") 
        const result = await runAlgGetResult(algName,[4])
        await deleteAlgorithm(algName,true)    
        expect(result.data[0].result.version).to.be.equal("gitlab branch1")   
      
    }).timeout(1000 * 60 * 20)

    it("test webhook github (git 518)",async ()=>{
        const data = {
            ref: 'refs/heads/master',
            before: 'f96bd9ffc2d6e0e31fea1b28328600156c5877b0',
            after: 'f96bd9ffc2d6e0e31fea1b28328600156c5877b0',
          
            commits: [
                {
                    id: 'f96bd9ffc2d6e0e31fea1b28328600156c5877b0'
                    
                }
            ],
           
            repository: {
               
                html_url: 'https://github.com/tamir321/hkube.git',
                description: null,
                fork: false,
                url: 'https://github.com/tamir321/hkube'                
            }
          
        }

        const entry = 'main'
        const algName= pipelineRandomName(8).toLowerCase()    

        const gitUrl = "https://github.com/tamir321/hkube.git"
        const branch = "master"
        const gitKind = "github"
        const commit  = {
            "id": "87b27e20c2a37ab11ef0d851479f473127c4400d"
            }
        const language ='python'
        const buildStatusAlg = await buildGitAlgorithm({algName,gitUrl,gitKind ,entry , branch ,language,commit,algorithmArray:algLIst})
        expect(buildStatusAlg.status).to.be.equal("completed") 
        const result = await runAlgGetResult(algName,[4])
        expect(result.data[0].result.commit).to.be.equal("A1")
        const currentVersion = await getAlgorithmVersion(algName);
        console.log("~~~~~~~~~~~~~~~~~~~")
        console.log(currentVersion.body)
        console.log("~~~~~~~~~~~~~~~~~~~")
       //send webhook
       // const f = JSON.stringify(data)
        const res = await chai.request(config.apiServerUrl)           
            .post('/builds/webhook/github')
            .type('form')
            .set('content-type', 'application/x-www-form-urlencoded')            
            .send ({'payload': JSON.stringify(data)}) 

       

         const  buildStatusAlg2 = await getStatusall(res.body[0].buildId, `/builds/status/`, 200, "completed", 1000 * 60 * 10)
         expect(buildStatusAlg2.status).to.be.equal("completed") 
         const newVersion = await getAlgorithmVersion(algName);
         console.log("~~~~~~~~~~~~~~~~~~~")
         console.log(newVersion.body)
         console.log("~~~~~~~~~~~~~~~~~~~")
         //v2.body.algorithm.version
         const updateVersion = await  updateAlgorithmVersion(algName,newVersion.body[0].version,true)
         await delay(5000)
         const resultAfterCommit = await runAlgGetResult(algName,[4])
        // await deleteAlgorithm(algName,true)   
        expect(resultAfterCommit.data[0].result.commit).to.be.equal("A4")


    }).timeout(1000 * 60 * 20)


    it("test github commit by tag",async ()=>{
        const entry = 'main'
        const algName= pipelineRandomName(8).toLowerCase()    

        const gitUrl = "https://github.com/tamir321/hkube.git"
        const branch = "master"
        const gitKind = "github"
        const commit  = "null"
        const tag = "A5"
        const language ='python'
        const buildStatusAlg = await buildGitAlgorithm({algName,gitUrl,gitKind ,entry , branch,language ,commit,tag,algorithmArray:algLIst})
        expect(buildStatusAlg.status).to.be.equal("completed") 
        const result = await runAlgGetResult(algName,[4])
        await deleteAlgorithm(algName,true) 
        expect(result.data[0].result.commit).to.be.equal("A5")
           
    }).timeout(1000 * 60 * 20)


    it("test webhook gitlab (git 518)",async ()=>{
      const data = {
        object_kind: "push",
        before: "95790bf891e76fee5e1747ab589903a6a1f80f22",
        after: "da1560886d4f094c3e6c9ef40349f7d38b5d27d7",
        ref: "refs/heads/master",
        checkout_sha: "da1560886d4f094c3e6c9ef40349f7d38b5d27d7",
       
        repository:{
          homepage: "https://gitlab.com/tamir321/hkube",
          git_http_url:"https://gitlab.com/tamir321/hkube.git"
        } ,
        commits: [
            {
                id: "507aa9b1db90ccda19aef145849fb18362ab1bb7",
                timestamp: "2011-12-12T14:27:31+02:00",
                url: "https://gitlab.com/tamir321/hkube/commit/507aa9b1db90ccda19aef145849fb18362ab1bb7"
                
            }
            ],
        total_commits_count: 4
       
      } 

      const entry = 'main'
      const algName= pipelineRandomName(8).toLowerCase()    

      const gitUrl = "https://gitlab.com/tamir321/hkube.git"
      const branch = "master"
      const gitKind = "gitlab"
      const commit  = {
          "id": "3d85086db8f5a842391a8c1f6cd88d8150670b68"
          }
     const language ='python'
      const buildStatusAlg = await buildGitAlgorithm({algName,gitUrl,gitKind ,entry , branch ,language  ,commit,algorithmArray:algLIst})
      expect(buildStatusAlg.status).to.be.equal("completed") 
      const result = await runAlgGetResult(algName,[4])
      expect(result.data[0].result.commit).to.be.equal("A5")
      
    
       const res = await chai.request(config.apiServerUrl)           
                 .post('/builds/webhook/gitlab')
                 .send(data)

        const  buildStatusAlg2 = await getStatusall(res.body[0].buildId, `/builds/status/`, 200, "completed", 1000 * 60 * 10)
        expect(buildStatusAlg2.status).to.be.equal("completed") 
        const newVersion = await getAlgorithmVersion(algName);
        console.log("~~~~~~~~~~~~~~~~~~~")
        console.log(newVersion.body)
        console.log("~~~~~~~~~~~~~~~~~~~")
        //v2.body.algorithm.version
        const updateVersion = await  updateAlgorithmVersion(algName,newVersion.body[0].version,true)
        await delay(5000)
        const resultAfterCommit = await runAlgGetResult(algName,[4])
      //  await deleteAlgorithm(algName,true)   
        expect(resultAfterCommit.data[0].result.commit).to.be.equal("A7")
    }).timeout(1000 * 60 * 20)

    
    it('gitlab repository authentication (Token)',async ()=>{

        const entry = 'main'
        const algName= pipelineRandomName(8).toLowerCase()    

        const gitUrl = "https://gitlab.com/tamir321/hkubepravate.git"
        const branch = "master"
        const gitKind = "gitlab"
        const commit  = {"id":"66e76131b39fd2e1df6b46ec179962fa7cbbd24c"}
        const tag = "null"
        const token = config.gitlabToken
        const language ='python'
        const failBuild =   await buildGitAlgorithm({algName,gitUrl,gitKind ,entry , branch ,language,commit,tag,algorithmArray:algLIst}) 
        expect(JSON.parse(failBuild.text).error.message).to.be.equal(`Not Found (${gitUrl.slice(0,-4)})`)
        const buildStatusAlg = await buildGitAlgorithm({algName,gitUrl,gitKind ,entry , branch ,language,commit,tag,token,algorithmArray:algLIst})
        expect(buildStatusAlg.status).to.be.equal("completed") 
        const result = await runAlgGetResult(algName,[4]) 
        expect(result.data[0].result.result).to.be.equal("private-repo") 
        await deleteAlgorithm(algName,true) 
     }).timeout(1000 * 60 * 20)

      it('github repository authentication',async ()=>{
        const entry = 'main'
        const algName= pipelineRandomName(8).toLowerCase()    

        const gitUrl = "https://github.com/tamir321/hkubePrivate.git"
        const branch = "master"
        const gitKind = "github"
        const commit  = "null"
        const tag = "null"
        const token =config.githubToken
        const language = 'python'
        const failBuild =   await buildGitAlgorithm({algName,gitUrl,gitKind ,entry , branch ,language ,commit,tag,algorithmArray:algLIst}) 
        expect(JSON.parse(failBuild.text).error.message).to.be.equal(`Not Found (${gitUrl.slice(0,-4)})`)
        const buildStatusAlg = await buildGitAlgorithm({algName,gitUrl,gitKind ,entry , branch ,language,commit,tag,token,algorithmArray:algLIst})
        expect(buildStatusAlg.status).to.be.equal("completed") 
        const result = await runAlgGetResult(algName,[4]) 
        expect(result.data[0].result).to.be.equal("private-repo") 
        await deleteAlgorithm(algName,true) 
     }).timeout(1000 * 60 * 20)


     describe('git hub/lab versions tests', () => {
        
        it("changing commit  trigger new build",async ()=>{
            const algName= pipelineRandomName(8).toLowerCase()    
            const entry = 'main'           
            const gitUrl = "https://gitlab.com/tamir321/hkube.git"
            const branch = "master"
            const gitKind = "gitlab"
            let commit  = {
                "id": "3d85086db8f5a842391a8c1f6cd88d8150670b68"
                }
            const language = 'python'
            const buildStatusAlg = await buildGitAlgorithm({algName,gitUrl,gitKind ,entry , branch ,language  ,commit,algorithmArray:algLIst})
            
            
            commit = {
                "id": "507aa9b1db90ccda19aef145849fb18362ab1bb7"
            }
            const buildStatusAlg2 = await buildGitAlgorithm({algName,gitUrl,gitKind ,entry , branch ,language ,commit,algorithmArray:algLIst})
            expect(buildStatusAlg2.buildId).to.be.not.equal(buildStatusAlg.buildId)
            //deleteAlgorithm(algName)
          }).timeout(1000 * 60 * 20)
      


          it("changing branch  trigger new build",async ()=>{
            const algName= pipelineRandomName(8).toLowerCase()    
            const entry = 'main'           
            const gitUrl = "https://gitlab.com/tamir321/hkube.git"
            const branch = "master"
            const gitKind = "gitlab"
            let commit  = {
                "id": "3d85086db8f5a842391a8c1f6cd88d8150670b68"
                }
            
            const buildStatusAlg = await buildGitAlgorithm(algName,gitUrl,gitKind ,entry , branch ,'python'  ,commit,algLIst)

            const Alg = {name : algName,
                gitRepository :{
                    url : gitUrl,
                    branch : "branch1"
                } }
            const jnk = await storeAlgorithmApplay(Alg)

          }).timeout(1000 * 60 * 20)



     })
})

})