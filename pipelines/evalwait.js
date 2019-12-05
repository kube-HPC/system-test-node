const tos = require('../utils/results').toString




const descriptor = {
    name: "evalwait",
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
        }
    ]
}

const input = {
   // name : "evalwait",
    flowInput: {
        inputs:[
            [15000,1]
        ]}
}


module.exports = {
    descriptor,
    input
}