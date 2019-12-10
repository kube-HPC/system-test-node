const tos = require('../utils/results').toString




const descriptor = {
    name: "eval-dynamic",
    nodes: [
        {
            nodeName: "eval1",
            algorithmName: "eval-alg",
            input: [
                "#@flowInput.range"
            ],
            extraData: {
                code: [
                    "(input) => {",
                    "const range = Array.from(Array(input[0]).keys());",
                    "return range }"
                ]
            }
        },
        {
            nodeName: "evalsleep",
            algorithmName: "eval-alg",
            input: [
                "#@eval1",
                "@flowInput.inputs"
            ],
            extraData: {
                code: [
                    "(input,require)=> {",
                        "return new Promise((resolve,reject)=>{setTimeout(()=>resolve(4),input[1])});}"
                ]
            }
        }
    ]
}

const input = {   
    flowInput: {
        range: 5,
        inputs:20000}
}


module.exports = {
    descriptor,
    input
}