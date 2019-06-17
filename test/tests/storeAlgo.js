const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const chaiHttp = require('chai-http');
const config = require('../../config/config');
const {
    getResult
} = require('../../utils/results');

const logger = require('../../utils/logger')
chai.use(chaiHttp);


describe('Store algorithm', () => {
    it('should store the file', async () => {
        const data = {
            name: 'testAlg',
            env: 'pyhton',
            algorithmImage: 'testAlg',
            cpu: 0.5,
            gpu: 0,
            mem: '512Mi',
            entryPoint: 'main.py',
            minHotWorkers: 0,
        }

    })


})