const tos = require('../utils/results').toString

const codeSubPipe = (input) => {
    const arr = []
    for (let i = 0; i < input.length; i++) {
        let current = input[i]
        arr.push(Math.sqrt(Math.pow(current + current * 3), 2))
    }
    return arr
}


const descriptor = {
    name: "subForDist",
    nodes: [{
        nodeName: "dist",
        algorithmName: "eval-alg",
        input: [
            "@flowInput.nums"
        ],
        extraData: {
            code: [
                tos(codeSubPipe)
            ]
        }
    }]
}

const input = {
    flowInput: {
        nums: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    }
}


module.exports = {
    descriptor,
    input
}