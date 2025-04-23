
const descriptor = {
    name: "pasueResumePipe",
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
            "nodeName": "firstbatch",
            "algorithmName": "eval-alg",
            "input": [
                "#@eval1",
                "@flowInput.inputs"
            ],
            "extraData": {
                "code": [
                    "(input,require)=> {",
                    "const promise = new Promise((resolve)=>{setTimeout(()=>resolve(4),input[1])});",
                    "return promise.then(value => value + 6);",
                    "}"
                ]
            }
        },
        {
            "nodeName": "secondbatch",
            "algorithmName": "eval-alg",
            "input": [
                "#@eval1",
                "@flowInput.inputs",
                "#@firstbatch"
            ],
            "extraData": {
                "code": [
                    "(input,require)=> {",
                    "const promise = new Promise((resolve)=>{setTimeout(()=>resolve(4),input[1])});",
                    "return promise.then(value => value + 6);",
                    "}"
                ]
            }
        }
    ]
}

const input = {   
    flowInput: {
        range: 50,
        inputs:3000}
}


module.exports = {
    descriptor,
    input
}