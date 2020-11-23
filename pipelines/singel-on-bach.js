const tos = require('../utils/results').toString




const descriptor = {
    name: "singel-on-batch",
    nodes: [
        {
            nodeName: "eval1",
            algorithmName: "eval-alg",
            input: [
                "@flowInput.range"
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
            nodeName: "two",
            algorithmName: "green-alg",
            input: [
                
                "#@eval1"
            ]
        },
        {
            nodeName: "evalsleep",
            algorithmName: "eval-alg",
            input: [
                
                "@flowInput.inputs"
            ],
            extraData: {
                code: [
                    "(input,require)=> {",
                        "return new Promise((resolve,reject)=>{setTimeout(()=>resolve(4),input[0])});}"
                ]
            }
        },
        {
            nodeName: "three",
            algorithmName: "yellow-alg",
            input: [
                "@evalsleep",
                "@two"
            ]
        }
    ]
}

const input = {   
    flowInput: {
        range: 10,
        inputs:50000}
}


module.exports = {
    descriptor,
    input
}