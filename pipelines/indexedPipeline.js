const tos = require('../utils/results').toString




const descriptor = {
    name: "indexedPipeline",
    nodes: [
        {
            nodeName: "evalsleep",
            algorithmName: "eval-alg",
            input: [
                "#@flowInput.inputs"
            ],
            extraData: {
                code: [
                    "(input,require)=> {",
                        "return new Promise((resolve,reject)=>{setTimeout(()=>resolve(input[0][1]),input[0][0])});}"
                ]
            }
        },
        {
            nodeName: "evalmult",
            algorithmName: "eval-alg",
            input: [               
                "#@flowInput.inputsmul"
            ],
            extraData: {
                code: [
                    "(input,require)=> {",
                    "let x1 = parseInt (input[0][0])",
                    "let x2 = parseInt (input[0][1])",
                    "return (x1*x2);}"
                ]
            }
        },
        {
            nodeName: "evaladd",
            algorithmName: "eval-alg",
            input: [
                "*@evalsleep",
                "*@evalmult"
            ],
            extraData: {
                code: [
                    "(input,require)=> {",
                    "let x1 = parseInt (input[0])",
                    "let x2 = parseInt (input[1])",
                    "return (x1+x2);}"
                ]
            }
        }
    ]
}

const input = {
   // name : "evalwait",
    flowInput: {
        inputs:[[10000,5],[5000,6],[15000,51],[7000,-5]],
        inputsmul:[[1,2],[7,3],[2,2],[1,2]]
    }
}


module.exports = {
    descriptor,
    input
}