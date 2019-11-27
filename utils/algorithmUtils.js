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


//TODO: add logs to all functions

const getAlgorithim = async (name) => {
    const res = await chai.request(config.apiServerUrl)
        .get(`/store/algorithms/${name}`)

    return res
}

//FIXME: storeAlgorithm and storeNewAlgorithm should not be both only one should be

const storeAlgorithm = async (descriptor) => {

    const res = await chai.request(config.apiServerUrl)
        .post('/store/algorithms/apply')
        .field('payload', JSON.stringify(descriptor))
    return res
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


const storeNewAlgorithm = async (algName) => {
    const res = await getAlgorithim(algName)
    console.log(res.status + " " + algName)
    if (res.status === 404) {
        const {
            alg
        } = require(path.join(process.cwd(), `additionalFiles/defaults/algorithms/${algName}`.toString()))
        const store = await storeAlgorithm(alg)
    }
}

const deleteAlgorithm = async (name) => {
    const res = await chai.request(config.apiServerUrl)
        .delete(`/store/algorithms/${name}`)

    return res
}





module.exports = {
    getAlgorithim,
    storeAlgorithm,
    deleteAlgorithm,
    storeNewAlgorithm,
    buildAlgorithm

}