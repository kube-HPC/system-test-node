const tos = require('../utils/results').toString

const retRange = (input) => {
    const range = Array.from(Array(input[0]).keys());
    return range
}




const descriptor = {
    name: "cache-test",
    nodes: [
        {
            nodeName: "eval1",
            algorithmName: "eval-alg",
            input: [
                "@flowInput.range"
            ],
            extraData: {
                code: [
                    tos(retRange)
                ]
            }
        },
        {
            nodeName: "long-string",
            algorithmName: "lonstringv1",
            input: [
                "@flowInput.inp"
            ],
            
            "metrics": {
                "tensorboard": true
            }
        },
        {
            nodeName: "eaval-combain",
            algorithmName: "eval-alg",
            input: [
                "#@eval1",
                "@long-string"
            ],
            extraData: {
                code: [
                    "(input) => {",
                    "const string = input[0]+input[1]",
                    "return 42 }"
                ]
            }
        }
    ],
}

const input = {
    flowInput: {
        range: 90,
        inp: 5000000
    }
}



module.exports = { descriptor, input }