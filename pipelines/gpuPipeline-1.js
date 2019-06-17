const descriptor = {
    name: 'gpu-demo-2',
    nodes: [{
        nodeName: 'keras',
        algorithmName: 'gpu-alg-2',
        input: [
            '#@flowInput.data'
        ]
    }],
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
        data: [{
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


module.exports = { descriptor, input }