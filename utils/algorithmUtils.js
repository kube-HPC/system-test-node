const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const delay = require('delay');
chai.use(chaiHttp);
const path = require('path')
const config = require(path.join(process.cwd(), 'config/config'))
const logger = require(path.join(process.cwd(), 'utils/logger'))
const {
        getResult,
        idGen,
        getStatusall} = require(path.join(process.cwd(), 'utils/results'))
const {
        write_log} = require(path.join(process.cwd(), 'utils/misc_utils'))


const fse = require('fs')

const logResult = (result, text = '') => {

    if (result.status > 201) {
        write_log(result.body, 'error')
    } else {
        write_log(`${text} -${result.status}`)
    }
}

const StoreDebugAlgorithm =  async (algorithmName) =>{

    const debudAlg = {
        "name": algorithmName
        }
    const res = await chai.request(config.apiServerUrl)
    .post('/store/algorithms/debug')
    .send(debudAlg)
    logResult(res, 'algorithmUtils StoreDebugAlgorithm')
    return res
}

const getAlgorithm = async (name) => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/store/algorithms/${name}`)
    logResult(res, "algorithmUtils getAlgorithm")
    return res
}


const storeAlgorithm = async (algName) => {

    const res = await getAlgorithm(algName)
    write_log(res.status + " " + algName)
    if (res.status === 404) {
        const {
            alg
        } = require(path.join(process.cwd(), `additionalFiles/defaults/algorithms/${algName}`))

        const res1 = storeAlgorithmApplay(alg)
        logResult(res1, "algorithmUtils storeAlgorithm")
        const timeout = await delay(1000 * 3);
        return res1
    }
}

const updateAlgorithm = async (algfile)=>{
    const{alg}=require(path.join(process.cwd(), `additionalFiles/defaults/algorithms/${algfile}`))
    const res = storeAlgorithmApplay(alg)
    logResult(res, "algorithmUtils updateAlgorithm")
    const timeout = await delay(1000 * 3);
    return res
}

const storeAlgorithmApplay = async (alg)=>{
    const res = await chai.request(config.apiServerUrl)
            .post('/store/algorithms/apply')
            .field('payload', JSON.stringify(alg))
    return res
}

const buildAlgorithm= async ({code, algName, entry,baseVersion='python:3.7',algorithmArray = []}) => {
    const data = {
        name: algName,
        env: 'python',
        cpu: 0.5,
        gpu: 0,
        mem: '512Mi',
        entryPoint: entry,
        minHotWorkers: 0,
        version: idGen(),
        baseImage:baseVersion
    }
    algorithmArray.push(algName)
    const res = await chai.request(config.apiServerUrl)
        .post('/store/algorithms/apply')
        .field('payload', JSON.stringify(data))
        .attach('file', fse.readFileSync(code), entry)

    logger.info(JSON.stringify(res.body))

    // res.should.have.status(200)
    expect(res.status).to.eql(200)
    const buildIdAlg = res.body.buildId
   
    return buildIdAlg
}

const buildAlgorithmAndWait = async ({code, algName, entry,baseVersion='python:3.7',algorithmArray = []}) => {
    
    const buildIdAlg = await buildAlgorithm({code:code,algName:algName,entry:entry,baseVersion:baseVersion,algorithmArray:algorithmArray})
    const buildStatusAlg = await getStatusall(buildIdAlg, `/builds/status/`, 200, "completed", 1000 * 60 * 10)

    return buildStatusAlg
}

const buildGitAlgorithm = async ({algName,gitUrl,gitKind ,entry , branch ,language = 'python',commit = "null" ,tag = "null" ,token="null",algorithmArray=[]})=>{
    const data = {
        name: algName,
        env: language,
        cpu: 0.5,
        gpu: 0,
        mem: '512Mi',
        entryPoint: entry,
        minHotWorkers: 0,        
        
        gitRepository : {
            url: gitUrl,
            branchName : branch,
            gitKind : gitKind
        }
    }
    algorithmArray.push(algName)
    if(typeof commit != "string"){
        
            data.gitRepository.commit = commit
        }

    if(tag != "null"){
        data.gitRepository.tag=tag
    }

    if(token != "null"){
        data.gitRepository.token=token
    }
    console.log(data)
    const res = await chai.request(config.apiServerUrl)
        .post('/store/algorithms/apply')
        .field('payload', JSON.stringify(data))       
    logger.info(JSON.stringify(res.body))
    if(res.status !=200){
        logger.info(JSON.stringify(res.text))
        return res
    }
    // res.should.have.status(200)
    expect(res.status).to.eql(200)
    const buildIdAlg = res.body.buildId
    const buildStatusAlg = await getStatusall(buildIdAlg, `/builds/status/`, 200, "completed", 1000 * 60 * 10)

    return buildStatusAlg

}

 
const runAlgGetResult =async (algName,inupts)=>{
    const alg = {name: algName,
    input:inupts}
    const res = await runAlgorithm(alg)
    const jobId = res.body.jobId
    const result = await  getResult(jobId,200)
    return result
   // expect(result.data[0].result).to.be.equal(42)
}
const runAlgorithm = async (body)=>{
    const res = await chai.request(config.apiServerUrl)
        .post('/exec/algorithm')
        .send( body)
    logResult(res, 'algorithmUtils runAlgorithm')
    return res
}

const getBuildList = async (name)=>{
    const res = await chai.request(config.apiServerUrl)
        .get(`/builds/list/${name}`)
    logResult(res, "algorithmUtils getBuildList")
    return res.body;

}

const getAlgorithmVersion = async (name)=>{
    const res = await chai.request(config.apiServerUrl)
        .get(`/versions/algorithms/${name}`)
    logResult(res, "algorithmUtils getAlgorithimVersion")
    return res;

}

const getAlgVersion = async (name,version)=>{
    const res = await chai.request(config.apiServerUrl)
        .get(`/versions/algorithms/${name}/${version}`)
    logResult(res, "algorithmUtils getAlgorithimVersion")
    return res;

}
const tagAlgorithmVersion = async (algName , algVersion ,algTag)=>{

    let  alg = { name : algName,
                 version : algVersion,
                 pinned : false,
                 tags: [algTag]
        
    } 

    const res = await chai.request(config.apiServerUrl)
        .post(`/versions/algorithms/tag`)
        .send(alg)
    logResult(res, "algorithmUtils tagAlgorithmVersion")
    
    return res;

}

const deleteAlgorithm = async (name,force = true) => {
    const res = await chai.request(config.apiServerUrl)
        .delete(`/store/algorithms/${name}?force=${force}`)
    logResult(res, "algorithmUtils deleteAlgorithm")
    return res
}

// const deleteAlgorithmVersion = async (name,image) => {
//     const res = await chai.request(config.apiServerUrl)
//         .delete(`/versions/algorithms/${name}?image=${image}`)
//     logResult(res, "algorithmUtils deleteAlgorithm")
//     return res
// }

const deleteAlgorithmVersion = async (name,version) => {
    const res = await chai.request(config.apiServerUrl)
        .delete(`/versions/algorithms/${name}/${version}`)
    logResult(res, "algorithmUtils deleteAlgorithm")
    return res
}
const updateAlgorithmVersion = async (Algname , algVersion, Force = true)=>{
    let value = {
        name: Algname,
        version: algVersion,
        force: Force
    }
    const res = await chai.request(config.apiServerUrl)
    .post(`/versions/algorithms/apply`)
    .send(value)

    return res
}

const stopBuild = async (buildId)=>{
    let body = {
        "buildId": buildId
      }

    const res = await chai.request(config.apiServerUrl)
    .post(`/builds/stop`)
    .send(body)

    return res
    
}


const rerunBuild = async (buildId)=>{
    let body = {
        "buildId": buildId
      }

    const res = await chai.request(config.apiServerUrl)
    .post(`/builds/rerun`)
    .send(body)

    return res
    
}

module.exports = {
   
    runAlgGetResult,
    StoreDebugAlgorithm,
    runAlgorithm,
    getAlgorithm,
    storeAlgorithm,
    updateAlgorithm,
    deleteAlgorithm,
    buildAlgorithm,
    buildAlgorithmAndWait,
    getAlgorithmVersion,
    updateAlgorithmVersion,
    storeAlgorithmApplay,
    buildGitAlgorithm,
    deleteAlgorithmVersion,
    logResult,
    stopBuild,
    rerunBuild,
    getBuildList,
    tagAlgorithmVersion,
    getAlgVersion

}