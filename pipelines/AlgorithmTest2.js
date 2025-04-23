const tos = require('../utils/results').toString

const retRange = (input) => {
    const range = Array.from(Array(input[0]).keys());
    return range
}




const descriptor = {
    name: "algorithm-version-test-v2",
    nodes: [
        {
            nodeName: "evalsleep",
            algorithmName: "eval-alg",
            input: [
                "@flowInput.inp"
            ],
            extraData: {
                code: [
                    "(input,require)=> {",
                    "const promise = new Promise((resolve)=>{setTimeout(()=>resolve(4),input)});",
                    "return promise.then(value => value + 6);",
                    "}"
                ]
            }
        },
        {
            nodeName: "evalsleep2",
            algorithmName: "eval-alg",
            input: [
                "@flowInput.inp",
                "@evalsleep"
            ],
            extraData: {
                code: [
                    "(input,require)=> {",
                    "const promise = new Promise((resolve)=>{setTimeout(()=>resolve(4),input)});",
                    "return promise.then(value => value + 6);",
                    "}"
                ]
            }
        },

        {
            nodeName: "algo-test",
            algorithmName: "eval-alg",
            input: [
                "@evalsleep2",
                "@flowInput.inp"

            ],

            "metrics": {
                "tensorboard": true
            }
        }
    ],
}

const input = {
    flowInput: {

        inp: 2000
    }
}



module.exports = { descriptor, input }