const chai = require('chai');
const expect = chai.expect;
const should = chai.should();

const chaiHttp = require('chai-http');
const path = require('path');
const config = require(path.join(process.cwd(), 'config/config'))
const {
    getStatusall,
    getResult
} = require(path.join(process.cwd(), 'utils/results'))
const {
    testData1
} = require(path.join(process.cwd(), 'config/index')).buildAlgPipe

const {
    storePipeline,
    deletePipeline,
    execPipeline
} = require(path.join(process.cwd(), 'utils/storeDelete'))


const fse = require('fs-extra')

const logger = require(path.join(process.cwd(), 'utils/logger'))
chai.use(chaiHttp);


describe('should load the read me files', () => {

    it('should load a readme file to a pipeline', async () => {

        const readMe = path.join(process.cwd(), 'additionalFiles/README.md');

        const res = await chai.request(config.apiServerUrl)
            .post('/readme/pipelines/batch')
            // .field('payload', JSON.stringify(data))
            .attach('txt', fse.readFileSync(readMe), 'readMe')

        console.log(res.body)
    })

})