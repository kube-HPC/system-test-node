const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const chaiHttp = require('chai-http');
const config = require('../../config/config');
const { getResult } = require('../../utils/results');

chai.use(chaiHttp);

const descriptor = {
    name: 'batch-eval',
    nodes: [
      {
        nodeName: 'eval1',
        algorithmName: 'eval-alg',
        input: [
          '@flowInput.range'
        ],
        extraData: {
          code: [
            '(input) => {',
            'const range = Array.from(Array(input[0]).keys());',
            'return range }'
          ]
        }
      },
      {
        nodeName: 'eval2',
        algorithmName: 'eval-alg',
        input: [
          '#@eval1'
        ],
        extraData: {
          code: [
            '(input) => {',
            'const result = input[0];',
            'return result }'
          ]
        }
      }
    ],
    flowInput: {
      range: 10
    },
    options: {
      batchTolerance: 100,
      progressVerbosityLevel: 'debug'
    },
    webhooks: {
      progress: 'http://localhost:3003/webhook/progress',
      result: 'http://localhost:3003/webhook/result'
    }
  };

describe('batch', () => {
    it('should run pipeline to completion', async () => {
        const body = descriptor;
        const res = await chai.request(config.apiServerUrl)
            .post('/exec/raw')
            .send(body);
        res.should.have.status(200);
        res.body.should.have.property('jobId');
        const jobId = res.body.jobId;

        
        const result = await getResult(jobId,200);
        expect(result.status).to.eql('completed')
    }).timeout(5000000);
});