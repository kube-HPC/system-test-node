const descriptor = {
    name: 'gpu-demo',
    nodes: [
      {
        nodeName: 'keras',
        algorithmName: 'gpu-alg',
        input: [
          '#@flowInput.data'
        ]
      }
    ],
    options: {
      batchTolerance: 100,
      progressVerbosityLevel: 'debug'
    },
    webhooks: {
      progress: 'http://localhost:3003/webhook/progress',
      result: 'http://localhost:3003/webhook/result'
    }
  }



  const input = {
    flowInput: {
        data: [
          {
            train_size: 300,
            num_epochs: 2,
            output: 's3://keras/xxx'
          },
          {
            train_size: 300,
            num_epochs: 2,
            output: 's3://keras/xxx'
          },
          {
            train_size: 300,
            num_epochs: 2,
            output: 's3://keras/xxx'
          },
          {
            train_size: 300,
            num_epochs: 2,
            output: 's3://keras/xxx'
          }
        ]
      }
  }


  module.exports = {descriptor, input}