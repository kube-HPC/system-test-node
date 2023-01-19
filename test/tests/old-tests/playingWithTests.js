const chai = require('chai');
const path = require('path');
const chaiHttp = require('chai-http');
const assertArrays = require('chai-arrays');
const {
    storePipeline,
    runStored,
    runStoredAndWaitForResults,
    deletePipeline
} = require('../../../utils/pipelineUtils')
const {
    getSpansByJodid
} = require('../../../utils/jaeger')
chai.use(chaiHttp);
chai.use(assertArrays);
const logger = require('../../../utils/logger');


describe('playing wiht tests', () => {
    it('eval-dynamic run', async () => {
        const store = await storePipeline('eval-dynamic')

        const res = await runStoredAndWaitForResults({
            name: "eval-dynamic",
            flowInput: {
                range: 1000,
                time: 10000
            }
        })


        const spans = await getSpansByJodid(res)
        logger.info(JSON.stringify(spans))
        // console.log (JSON.stringify (spans))

        await deletePipeline('eval-dynamic')
    }).timeout(1000 * 60 * 10)
})