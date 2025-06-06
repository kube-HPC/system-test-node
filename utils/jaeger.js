const chai = require('chai');
const path = require('path');
const config = require(path.join(process.cwd(), 'config/config'))

const getSpansByJodid = async (jobId, token = {}) => {
    const res = await chai.request(config.baseUrl).
        get(`/hkube/api-server//api/v1/jaeger?jobId=${jobId}`)
        .set('Authorization', `Bearer ${token}`);

    if (res.status !== 200) {
        throw new Error(`Failed to get spans: Code ${res.status}\n${res.text}`);
    }

    const responseBody = JSON.parse(res.text);

    if (!responseBody.data || !responseBody.data[0] || !responseBody.data[0].spans) {
        throw new Error(`No spans found for jobId: ${jobId}`);
    }

    return JSON.parse(res.text).data[0].spans;
}
//  https://cicd-test.hkube.org/hkube/api-server//api/v1/jaeger?jobId=main:versatile-pipe:c005ca0a-d318-420f-94c3-63e566b9a126
module.exports = { getSpansByJodid }


// const getSpansByJodid = async (jobId) =>{
//     const res = await chai.request(config.jagearApiUrl).
//         get(`/jaeger/api/traces?lookback=1h&maxDuration&minDuration&service=worker&tags={"jobId":"${jobId}"}`)
//     return res.body.data[0].spans
// }