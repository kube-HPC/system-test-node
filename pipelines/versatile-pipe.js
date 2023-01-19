const path = require('path');
const tos = require('../utils/results').toString
const {
    write_log
} = require('../utils/misc_utils')



const descriptor = {
    name: "versatile-pipe",
    nodes: [{
        nodeName: "versatile",
        algorithmName: "versatile",
        input: [
            "@flowInput.inp"
        ]
    }]
}

const input = {
    flowInput: {
        inp: [{
            type: "algorithm",
            name: "black-alg",
            input: ["a"]
        }]
    }
}


module.exports = {
    descriptor,
    input
}