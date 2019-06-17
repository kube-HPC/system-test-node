const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const chaiHttp = require('chai-http');
const config = require('../../config/config');
const { getResult } = require('../../utils/results');
const { testData1 } = require('../../config/index').tid_110
const logger = require('../../utils/logger')
const delay = require('delay');

chai.use(chaiHttp);



describe('severity levels test', () => {
  before('store pipeline eval error', async () => {
    const pipeline = testData1.descriptor;
    const res1 = await chai.request(config.apiServerUrl)
      .post('/store/pipelines')
      .send(pipeline);

    // logger.info(`executing addmult pipeline`)
    // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
    // res1.should.have.status(201);
  })

  it('should complete the pipeline, 100 percent tolerance with one fail', async () => {
    const name = testData1.descriptor.name
    let body = {
      flowInput: {
        nums: [
          1,
          24,
          3,
          4,
          5
        ]
      },
      options: {
        batchTolerance: 100,
        progressVerbosityLevel: 'debug'
      }
    }

    body.name = name
    const res = await chai.request(config.apiServerUrl)
      .post('/exec/stored')
      .send(body)
    // console.log (res)
    res.should.have.status(200);
    res.body.should.have.property('jobId');
    const jobId = res.body.jobId;

    await delay(10000)

    const result = await getResult(jobId, 200);
    if ('error' in result) {
      process.stdout.write(result.error)

    }

    logger.info(`getting results from execution`)
    logger.info(`${res.status} ${JSON.stringify(res.body)}`)

    expect(result.status).to.eql('completed')
    expect(result).to.not.have.property('error')
  }).timeout(5000000);



  it('should fail the pipeline, 20 percent tolerance with one fail', async () => {
    const name = testData1.descriptor.name
    let body = {
      flowInput: {
        nums: [
          1,
          24,
          3,
          4,
          5
        ]
      },
      options: {
        batchTolerance: 20,
        progressVerbosityLevel: 'debug'
      }
    }

    body.name = name
    const res = await chai.request(config.apiServerUrl)
      .post('/exec/stored')
      .send(body)
    // console.log (res)
    res.should.have.status(200);
    res.body.should.have.property('jobId');
    const jobId = res.body.jobId;

    await delay(10000)

    const result = await getResult(jobId, 200);

    logger.info(`getting results from execution`)
    logger.info(`${res.status} ${JSON.stringify(res.body)}`)

    expect(result.status).to.eql('failed')
    expect(result).to.have.property('error')
  }).timeout(5000000);


  it('should complete the pipeline, 60 percent tolerance with one fail', async () => {
    const name = testData1.descriptor.name
    let body = {
      flowInput: {
        nums: [
          1,
          24,
          3,
          4,
          5
        ]
      },
      options: {
        batchTolerance: 60,
        progressVerbosityLevel: 'debug'
      }
    }

    body.name = name
    const res = await chai.request(config.apiServerUrl)
      .post('/exec/stored')
      .send(body)
    // console.log (res)
    res.should.have.status(200);
    res.body.should.have.property('jobId');
    const jobId = res.body.jobId;

    await delay(10000)

    const result = await getResult(jobId, 200);
    if ('error' in result) {
      process.stdout.write(result.error)

    }


    logger.info(`getting results from execution`)
    logger.info(`${res.status} ${JSON.stringify(res.body)}`)

    expect(result.status).to.eql('completed')
    expect(result).to.not.have.property('error')
  }).timeout(5000000);


  it('should fail the pipeline, 20 percent tolerance with one fail', async () => {
    const name = testData1.descriptor.name
    let body = {
      flowInput: {
        nums: [
          1,
          24,
          3,
          4,
          5
        ]
      },
      options: {
        batchTolerance: 20,
        progressVerbosityLevel: 'debug'
      }
    }

    body.name = name
    const res = await chai.request(config.apiServerUrl)
      .post('/exec/stored')
      .send(body)
    // console.log (res)
    res.should.have.status(200);
    res.body.should.have.property('jobId');
    const jobId = res.body.jobId;

    await delay(10000)

    const result = await getResult(jobId, 200);

    logger.info(`getting results from execution`)
    logger.info(`${res.status} ${JSON.stringify(res.body)}`)

    expect(result.status).to.eql('failed')
    expect(result).to.have.property('error')
  }).timeout(5000000);



  it('should fail the pipeline, -2 percent tolerance with one fail', async () => {
    const name = testData1.descriptor.name
    let body = {
      flowInput: {
        nums: [
          1,
          24,
          3,
          4,
          5
        ]
      },
      options: {
        batchTolerance: -2,
        progressVerbosityLevel: 'debug'
      }
    }

    body.name = name
    const res = await chai.request(config.apiServerUrl)
      .post('/exec/stored')
      .send(body)
    // console.log (res)
    res.should.have.status(400);
    res.body.should.have.property('error');
    expect(res.body.error.message).to.include('batchTolerance should be >= 0')
  }).timeout(5000000);


  it('should fail the pipeline, 101 percent tolerance with one fail', async () => {
    const name = testData1.descriptor.name
    let body = {
      flowInput: {
        nums: [
          1,
          24,
          3,
          4,
          5
        ]
      },
      options: {
        batchTolerance: 101,
        progressVerbosityLevel: 'debug'
      }
    }

    body.name = name
    const res = await chai.request(config.apiServerUrl)
      .post('/exec/stored')
      .send(body)
    // console.log (res)
    res.should.have.status(400);
    res.body.should.have.property('error');
    expect(res.body.error.message).to.include('batchTolerance should be <= 100')
  }).timeout(5000000);


  it('should fail the pipeline, 20.6 percent tolerance with one fail', async () => {
    const name = testData1.descriptor.name
    let body = {
      flowInput: {
        nums: [
          1,
          24,
          3,
          4,
          5
        ]
      },
      options: {
        batchTolerance: 20.6,
        progressVerbosityLevel: 'debug'
      }
    }

    body.name = name
    const res = await chai.request(config.apiServerUrl)
      .post('/exec/stored')
      .send(body)
    // console.log (res)
    res.should.have.status(400);
    res.body.should.have.property('error');
    expect(res.body.error.message).to.include('batchTolerance should be integer')
  }).timeout(5000000);



  it('should fail the pipeline, "twenty" percent tolerance with one fail', async () => {
    const name = testData1.descriptor.name
    let body = {
      flowInput: {
        nums: [
          1,
          24,
          3,
          4,
          5
        ]
      },
      options: {
        batchTolerance: 'twenty"',
        progressVerbosityLevel: 'debug'
      }
    }

    body.name = name
    const res = await chai.request(config.apiServerUrl)
      .post('/exec/stored')
      .send(body)
    // console.log (res)
    res.should.have.status(400);
    res.body.should.have.property('error');
    expect(res.body.error.message).to.include('batchTolerance should be integer')
  }).timeout(5000000);



  after('delete stored pipeline eval error', async () => {
    const name = testData1.descriptor.name;
    const res1 = await chai.request(config.apiServerUrl)
      .delete(`/store/pipelines/${name}`)

    // logger.info(`deleting pipeline addmult`)
    // logger.info(`${res1.status} ${JSON.stringify(res1.body)}`)
    res1.should.have.status(200);
  })

});