// const chai = require('chai');
// const expect = chai.expect;
// const should = chai.should();

// const chaiHttp = require('chai-http');
// const path = require('path');
// const {
//     getResult
// } = require(path.join(process.cwd(), 'utils/results'))
// const {
//     testData1,
//     testData2
// } = require(path.join(process.cwd(), 'config/index')).subPipeline;

// const {
//     storePipeline,
//     runStored,
//     deconstructTestData,
//     checkResults,
//     deletePipeline
// } = require(path.join(process.cwd(), 'utils/pipelineUtils'))

// const fse = require('fs-extra')

// const logger = require(path.join(process.cwd(), 'utils/logger'))
// chai.use(chaiHttp);

// describe('sub pipeline', () => {

//     it('should run the main pipeline', async () => {

//         const d1 = deconstructTestData(testData1)
//         const d2 = deconstructTestData(testData2)

//         await storePipeline(d1)
//         await storePipeline(d2)

//         const res = await runStored(d1)

//         await checkResults(res, 200, 'completed', false)

//         await deletePipeline(d1)
//         await deletePipeline(d2)

//     }).timeout(5000000);

// })