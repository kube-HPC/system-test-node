const tos = require('../utils/results').toString




const descriptor = {
    name: "eval-dynamic-400",
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
            nodeName: "evalsleep",
            algorithmName: "eval-alg",
            input: [
                "#@eval1",
                "@flowInput.inputs"
            ],
            extraData: {
                code: [
                    "(input,require)=> {",
                    "const promise = new Promise((resolve)=>{setTimeout(()=>resolve(30),input[1])});",
                    "return promise.then(value => value + 6);",
                    "}"
                ]
            }
        }
    ]
    ,
    "options": {
      
        "concurrentPipelines": {
            "amount": 25,
            "rejectOnFailure": false
        },
        "progressVerbosityLevel": "info",
        "ttl": 3600
    },
    "webhooks": {
        "progress": "http://54.195.234.52:3000/webhook/testWebhook",
        "result": "http://54.195.234.52:3000/webhook/testWebhook"
    }
}

const input = {   
    flowInput: {
        range: 7,
        inputs:50000}
}


module.exports = {
    descriptor,
    input
}