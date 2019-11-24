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




module.exports = {
    getAlgorithim,
    storeAlgorithm,
    deleteAlgorithm

}