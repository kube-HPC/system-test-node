const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

chai.use(chaiHttp);
const path = require('path')
const config = require(path.join(process.cwd(), 'config/config'))

const getProgress = async (jobId) => {
    const res = await chai.request(config.webhookUrl)
        .get(`/progress/${jobId}`)    
    return res
}

const getResults = async (jobId) => {
    const res = await chai.request(config.webhookUrl)
        .get(`/results/${jobId}`)    
    return res
}


module.exports = { 
    getProgress,
    getResults
}