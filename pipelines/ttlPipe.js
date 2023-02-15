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
                    "return new Promise((resolve,reject)=>{setTimeout(()=>resolve(42),input[0])});}"
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