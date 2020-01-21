const tos = require('../utils/results').toString




const descriptor = {
    name: "WaitAny",
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
            nodeName: "evaladd",
            algorithmName: "eval-alg",
            input: [
                "*@evalsleep",
                "@flowInput.inputsadd"
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
        inputs:[
            [10000,5],[5000,12],[15000,87],[7000,125]
        ],
        inputsadd:[3]}
}


module.exports = {
    descriptor,
    input
}