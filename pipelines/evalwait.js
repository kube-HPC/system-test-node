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
                    "const promise = new Promise((resolve)=>{setTimeout(()=>resolve(input[0][1]),input[0][0])});",
                    "return promise.then(value => value + 6);",
                    "}"
                ]
            }
        }
    ]
}

const input = {
   // name : "evalwait",
    flowInput: {
        inputs:[
            [25000,1]
        ]}
}


module.exports = {
    descriptor,
    input
}