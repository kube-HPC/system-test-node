const chai = require('chai');
const path = require('path')
const config = require(path.join(process.cwd(), 'config/config'))
const logger = require(path.join(process.cwd(), 'utils/logger'))


const getSpansByJodid = async (jobId) =>{
    const res = await chai.request(config.jagearApiUrl).
        get(`/jaeger?jobId=${jobId}`)
    return res.body.data[0].spans
}

module.exports = {getSpansByJodid}