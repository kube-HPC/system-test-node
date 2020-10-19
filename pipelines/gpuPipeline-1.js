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
                output: '/var/metrics'
            },
            {
                train_size: 500,
                num_epochs: 2,
                output: '/var/metrics'
            },
            {
                train_size: 600,
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