const descriptor = {
    name: "bytes",
    nodes: [
        {
            nodeName: "evalCreate",
            algorithmName: "eval-alg",
            input: [
                "@flowInput.num"
               
            ],
            extraData: {
                code: [
                    "(input)=> {",
                    "let b = []",
                    "let a = input[0]",
                    "for (let i=0 ; i<a ; i++)",
                    "{b.push (i)}",
                    "return b",
                    "}"
                ]
            }
        },
        {
            nodeName: "evalPrint",
            algorithmName: "eval-alg",
            input: [
                "@evalCreate"
            ],
            extraData: {
                "code": [
                    "(input)=> {",
                    "return input[0].length",
                    "}"
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
        num: 1000000     
    }
}





module.exports = { input, descriptor }