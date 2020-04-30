const tos = require('../utils/results').toString




const descriptor = {
    name: "countLetters",
    nodes: [
        {
            nodeName: "text",
            algorithmName: "eval-alg",
            input: [
                "@flowInput.text"
            ],
            extraData: {
                code: [
                    "function split(input) {",
                     "return input[0].split(' ');",
                    "}"
                ]
            }
        },
        {
            nodeName: "count",
            algorithmName: "eval-alg",
            input: [
                "#@text",
                "@flowInput.letter"
            ],
            extraData: {
                code: [
                    "function reduce(input) {",
                  "return Array.from(input[0]).filter(r => r === input[1]).length",
                "}"
                ]
            }
        }
    ]
}

const input = {   
    flowInput: {
        text: "It has been claimed that Eulers identity appears in his monumental work of mathematical analysis published",
        letter:"a"}
}


module.exports = {
    descriptor,
    input
}