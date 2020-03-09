const tos = require('../utils/results').toString




const descriptor = {
    name: "batch-on-batch",
    nodes: [
        {
            nodeName: "one",
            algorithmName: "eval-alg",
            input: [
                "#@flowInput.inputs"
            ],
            retry: {
                policy: "OnCrash",
                limit: 2
            },
            extraData: {
                code: [
                    "function exit(input) {",
                    "if(input !=1){",
                    "process.exit(input)}", 
                    "return 42}"
                ]
            }
        },
        {
            nodeName: "two",
            algorithmName: "eval-alg",
            input: [
                "#@one"
            ],
            extraData: {
                code: [
                    "(input) =>{return 42 + input}"  
                ]
            }
        }
    ],
    options: {
        batchTolerance: 80,
        concurrentPipelines: {
            "amount": 10,
            "rejectOnFailure": true
          },
        progressVerbosityLevel: "info",
        ttl: 3600
    },
}

const input = {
   
   // name : "evalwait",
    flowInput: {
        inputs:[
            [1],[1],[1],[1],[1],[0],[1],[1],[1]
        ]}
}


module.exports = {
    descriptor,
    input
}