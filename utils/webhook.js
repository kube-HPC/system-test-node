const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);
const path = require('path');
const config = require(path.join(process.cwd(), 'config/config'));

const getProgress = async (jobId, token = {}) => {
    const res = await chai.request(config.webhookUrl)
        .get(`/progress/${jobId}`)
        .set('Authorization', `Bearer ${token}`);
    return res;
}

const getResults = async (jobId, token = {}) => {
    const res = await chai.request(config.webhookUrl)
        .get(`/results/${jobId}`)
        .set('Authorization', `Bearer ${token}`);
    return res;
}

module.exports = { 
    getProgress,
    getResults
}
