const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const config = require(path.join(process.cwd(), 'config/config'));
const {
  getResult
} = require(path.join(process.cwd(), 'utils/results'))
const {
  testData1
} = require(path.join(process.cwd(), 'config/index')).tid_110
const logger = require(path.join(process.cwd(), 'utils/logger'))
const delay = require('delay');
const {
  storePipeline,
  runStored,
  checkResults,
  deletePipeline
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))
chai.use(chaiHttp);


describe('TID_110 severity levels test', () => {

  const dataSort = (obj) => {
    testData1.descriptor.options = obj.options
    testData1.descriptor.flowInput = obj.flowInput

  }


  it('should complete the pipeline, 100 percent tolerance with one fail', async () => {

    const obj = {
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


    dataSort(obj)

    const d = testData1.descriptor
    //store pipeline
    await storePipeline(d)


    const res = await runStored(d.name)


    await checkResults(res, 200, 'completed', d, true)

  }).timeout(5000000);



  it('should fail the pipeline, 20 percent tolerance with one fail', async () => {
    const obj = {
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

    dataSort(obj)
    const d = testData1.descriptor


    await storePipeline(d)
    const res = await runStored(d.name)

    await checkResults(res, 200, 'failed', d, true)

  }).timeout(5000000);


  it('should complete the pipeline, 60 percent tolerance with one fail', async () => {
    const obj = {
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

    dataSort(obj)
    const d = testData1.descriptor


    await storePipeline(d)
    const res = await runStored(d.name)

    await checkResults(res, 200, 'completed', d, true)
  }).timeout(5000000);


  it('should fail the pipeline, -2 percent tolerance with one fail', async () => {
    const obj = {
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

    dataSort(obj)
    const d = testData1.descriptor

    const res = await storePipeline(d)

    expect(res.status).to.eql(400)
    expect(res.body).to.have.property('error')
    expect(res.body.error.message).to.include('batchTolerance should be >= 0')

    await deletePipeline(d)

  }).timeout(5000000);


  it('should fail the pipeline, 101 percent tolerance with one fail', async () => {
    const obj = {
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

    dataSort(obj)
    const d = testData1.descriptor

    const res = await storePipeline(d)

    expect(res.status).to.eql(400)
    expect(res.body).to.have.property('error')
    expect(res.body.error.message).to.include('batchTolerance should be <= 100')


    await deletePipeline(d)

  }).timeout(5000000);


  it('should fail the pipeline, 20.6 percent tolerance with one fail', async () => {
    const obj = {
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

    dataSort(obj)
    const d = testData1.descriptor

    const res = await storePipeline(d)
    expect(res.status).to.eql(400)


    expect(res.body).to.have.property('error')
    expect(res.body.error.message).to.include('batchTolerance should be integer')


    await deletePipeline(d)

  }).timeout(5000000);



  it('should fail the pipeline, "twenty" percent tolerance with one fail', async () => {
    const obj = {

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
        batchTolerance: 'twenty',
        progressVerbosityLevel: 'debug'

      }
    }

    dataSort(obj)
    const d = testData1.descriptor

    const res = await storePipeline(d)
    expect(res.status).to.eql(400)
    expect(res.body).to.have.property('error')
    expect(res.body.error.message).to.include('batchTolerance should be integer')

    await deletePipeline(d)

  }).timeout(5000000);

});