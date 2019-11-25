const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

chai.use(chaiHttp);
const path = require('path')
const config = require(path.join(process.cwd(), 'config/config'))
const logger = require(path.join(process.cwd(), 'utils/logger'))
const {
    getResult
} = require(path.join(process.cwd(), 'utils/results'))


const getAlgorithim = async(name) =>{   
    const res = await chai.request(config.apiServerUrl)
        .get(`/store/algorithms/${name}`)
        
        return res
}
const storeAlgorithm = async (descriptor) => {
    
    const res = await chai.request(config.apiServerUrl)
        .post('/store/algorithms/apply')
        .field('payload', JSON.stringify(descriptor))
        return res
}

const deleteAlgorithm = async (name) => {
    const res = await chai.request(config.apiServerUrl)
        .delete(`/store/algorithms/${name}`)

    return res
}

const storeNewAlgorithm = async (algName)=>{
    const res = await getAlgorithim(algName)
        console.log(res.status + " " + algName)
        if (res.status === 404) {
            const { alg } = require(path.join(process.cwd(), `additionalFiles/defaults/algorithms/${algName}`.toString()))
            const store = await storeAlgorithm(alg)
        }
}



module.exports = {
    getAlgorithim,
    storeAlgorithm,
    deleteAlgorithm,
    storeNewAlgorithm

}