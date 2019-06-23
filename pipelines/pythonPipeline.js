const tos = require('../utils/results').toString


const retRange = (input) => {
    const range = Array.from(Array(input[0]).keys());
    return range
}


const descriptor = {
    name: "buildPipeline",
    nodes: [{
            nodeName: "evalSplit",
            algorithmName: "eval-alg",
            input: [
                "@flowInput.quantity"
            ],
            extraData: {
                code: [
                    tos(retRange)
                ]
            }
        },
        {
            nodeName: "pyEye",
            algorithmName: "testalg",
            input: [
                "#@evalSplit",
            ]
        }
    ]
}

const input = {
    flowInput: {
        quantity: 3
    }
}

const data = [{
    nodeName: "evalmul",
    algorithmName: "eval-alg",
    result: 24
}]


module.exports = {
    input,
    descriptor,
    data
}