const descriptor = {
    name: "multadd",
    nodes: [
        {
            nodeName: "evaladd",
            algorithmName: "eval-alg",
            input: [
                "@flowInput.addInput",
                "@evalmul"
            ],
            extraData: {
                code: [
                    "(input,require)=> {",
                    "const result = input[0][0]+input[1]",
                    "return result;}"
                ]
            }
        },
        {
            nodeName: "evalmul",
            algorithmName: "eval-alg",
            input: [
                "@flowInput.multInput"
            ],
            extraData: {
                "code": [
                    "(input,require)=> {",
                    "const result = input[0][0]*input[0][1]",
                    "return result;}"
                ]
            }
        }
    ],
    "options": {
        "batchTolerance": 80,
        "progressVerbosityLevel": "info"
    }
}

const input = {
    flowInput: {
        addInput: [3],
        multInput: [5, 3]
    }
}

const data = [
    {
        nodeName: "evaladd",
        algorithmName: "eval-alg",
        result: 18
    }

]



module.exports = { input, descriptor, data }