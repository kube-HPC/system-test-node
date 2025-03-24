const tos = require('../utils/results').toString




const descriptor = {
    name: "ttlPipe",
    nodes: [
        {
            nodeName: "evalsleep",
            algorithmName: "eval-alg",
            input: [
                "#@flowInput.inputs"
            ],
            extraData: {
                code: [
                    "(input,require)=> {",
                    "const promise = new Promise((resolve)=>{setTimeout(()=>resolve(42),input[0])});",
                    "return promise.then(value => value + 6);",
                    "}"
                ]
            }
        }
    ],
    options: {

        concurrentPipelines: {
            amount: 1,
            rejectOnFailure: false
        },
        ttl: 30,
        activeTtl: 25
    }

}

const input = {
    // name : "evalwait",
    flowInput: {
        inputs: [
            100000
        ]
    },
    options: {
        ttl: 30,
        activeTtl: 25
    }
}


module.exports = {
    descriptor,
    input
}