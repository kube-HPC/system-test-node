const tos = require('../utils/results').toString

const retRange = (input) => {
    const range = Array.from(Array(input[0]).keys());
    return range
}

const wait = (input) => {
    return new Promise((resolve, reject) => { setTimeout(() => resolve(4), input[1]) });
}


const descriptor = {
    name: "eval-dynamic",
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
            nodeName: "evalsleep",
            algorithmName: "eval-alg2",
            input: [
                "#@eval1",
                "@flowInput.time"
            ],
            extraData: {
                code: [
                    tos(wait)
                ]
            }
        }
    ],
}

const input = {
    flowInput: {
        range: 100,
        time: 10000
    }
}



module.exports = { descriptor, input }