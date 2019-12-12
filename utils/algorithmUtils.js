const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

chai.use(chaiHttp);
const path = require('path')
const config = require(path.join(process.cwd(), 'config/config'))
const logger = require(path.join(process.cwd(), 'utils/logger'))
const {
    idGen,
    getStatusall
} = require(path.join(process.cwd(), 'utils/results'))
const {
    write_log
} = require(path.join(process.cwd(), 'utils/misc_utils'))


const fse = require('fs')

const logResult = (result, text = '') => {

    if (result.status > 201) {
        write_log(result.body, 'error')
    } else {
        write_log(`${text} -${result.status}`)
    }
}



const getAlgorithim = async (name) => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/store/algorithms/${name}`)
    logResult(res, "algorithmUtils getAlgorithm")
    return res
}


const storeAlgorithm = async (algName) => {

    const res = await getAlgorithim(algName)
    write_log(res.status + " " + algName)
    if (res.status === 404) {
        const {
            alg
        } = require(path.join(process.cwd(), `additionalFiles/defaults/algorithms/${algName}`))

        const res1 = await chai.request(config.apiServerUrl)
            .post('/store/algorithms/apply')
            .field('payload', JSON.stringify(alg))
        logResult(res1, "algorithmUtils storeAlgorithm")
        return res1
    }
}


const buildAlgorithm = async (code, algName, entry) => {
    const data = {
        name: algName,
        env: 'python',
        cpu: 0.5,
        gpu: 0,
        mem: '512Mi',
        entryPoint: entry,
        minHotWorkers: 0,
        version: idGen()
    }

    const res = await chai.request(config.apiServerUrl)
        .post('/store/algorithms/apply')
        .field('payload', JSON.stringify(data))
        .attach('file', fse.readFileSync(code), entry)

    logger.info(JSON.stringify(res.body))

    // res.should.have.status(200)
    expect(res.status).to.eql(200)
    const buildIdAlg = res.body.buildId
    const buildStatusAlg = await getStatusall(buildIdAlg, `/builds/status/`, 200, "completed", 1000 * 60 * 10)

    return buildStatusAlg
}




const deleteAlgorithm = async (name) => {
    const res = await chai.request(config.apiServerUrl)
        .delete(`/store/algorithms/${name}`)
    logResult(res, "algorithmUtils deleteAlgorithm")
    return res
}





module.exports = {
    getAlgorithim,
    storeAlgorithm,
    deleteAlgorithm,
    buildAlgorithm,
    logResult

}