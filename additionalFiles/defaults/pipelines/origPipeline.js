const path = require('path')
const tos = require('./../../../utils/results').toString



const add = (input) => {
    return input[0][0] + input[0][1]
}

const mult = (input) => {

    return input[0] * input[1][0]
}

const pipe = {
    name: "pipe1",
    nodes: [{
        nodeName: "evaladd",
        algorithmName: "eval-alg",
        input: [
            "@flowInput.addInput"
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
            "@flowInput.multInput"
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
    }
}






module.exports = {
    pipe
}