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


const fse = require('fs')

const logResult = (result, text = '') => {

    if (result.status > 201) {
        logger.error(result.body)
    } else {
        logger.info(`${text} -${result.status}`)
    }
}


//TODO: add logs to all functions

const getAlgorithim = async (name) => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/store/algorithms/${name}`)
    logResult(res, "algorithmUtils getAlgorithm")
    return res
}


const storeAlgorithm = async (descriptor) => {

    const res = await getAlgorithim(algName)
    console.log(res.status + " " + algName)
    if (res.status === 404) {
        const {
            alg
        } = require(path.join(process.cwd(), `additionalFiles/defaults/algorithms/${algName}`))

        const res1 = await chai.request(config.apiServerUrl)
            .post('/store/algorithms/apply')
            .field('payload', JSON.stringify(descriptor))
        return res1
        logResult(res1, "algorithmUtils storeAlgorithm")
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