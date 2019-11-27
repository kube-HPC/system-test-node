const chai = require('chai');
const path = require('path');
const chaiHttp = require('chai-http');
const assertArrays = require('chai-arrays');
const {
    runStoredAndWaitForResults
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))
const {
    getSpansByJodid
} = require(path.join(process.cwd(), 'utils/jaeger'))
chai.use(chaiHttp);
chai.use(assertArrays);


describe('jagear', () => {
    it('test', async () => {

        const algName = "black-alg"
        const pipe = {
            "name": "versatile-pipe",
            "flowInput": {
                "inp": [{
                    "type": "algorithm",
                    "name": `${algName}`
                }]
            }
        }

        const jobId = await runStoredAndWaitForResults(pipe)
        const data = await getSpansByJodid(jobId)
        let found = false
        data.forEach(element => {
            // console.log(element.operationName)
            if (element.operationName.startsWith(algName)) {
                found = true
            }

        });

        found.should.be.true
    }).timeout(1000 * 60)
})