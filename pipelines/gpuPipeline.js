const descriptor = {
    name: 'gpu-demo-1',
    nodes: [{
        nodeName: 'keras',
        algorithmName: 'gpu-alg-1',
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
                train_size: 200,
                num_epochs: 2,
                output: '/var/metrics'
            },
            {
                train_size: 400,
                num_epochs: 2,
                output: '/var/metrics'
            },
            {
                train_size: 700,
                num_epochs: 2,
                output: '/var/metrics'
            },
            {
                train_size: 800,
                num_epochs: 2,
                output: '/var/metrics'
            }
        ]
    }
}


module.exports = { descriptor, input }