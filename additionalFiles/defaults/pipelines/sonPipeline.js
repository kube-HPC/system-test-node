const path = require('path')
const tos = require(path.join(process.cwd(), 'utils/results')).toString



const add = (input) => {
    return input[0][0] + input[0][1]
}

const mult = (input) => {

    return input[0] * input[1][0]
}

const pipe = {
    name: "pipe2",
    nodes: [{
            nodeName: "evaladd",
            algorithmName: "eval-alg",
            input: [
                "@flowInput"
            ],
            extraData: {
                code: [
                    tos(add)
                ]
            }
        },
        {
            nodeName: "evalmul",
            algorithmName: "eval-alg",
            input: [
                "@evaladd",
                "@flowInput"
            ],
            extraData: {
                code: [
                    tos(mult)
                ]
            }
        }
    ],
    flowInput: {
        addInput: [5, 3],
        multInput: [3]
    },
    triggers: {
        pipelines: ['pipe1']
    }
}






module.exports = {
    pipe
}