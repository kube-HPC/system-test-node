

const descriptor = {
    name: "triggered",
    nodes: [{
            nodeName: "evaladd25",
            algorithmName: "eval-alg",
            input: [
                "#@flowInput.parent"
            ],
            extraData: {
                code: [
                    "(input,require)=> {",
                    "const result = Number(input[0].result)+25",
                    "return result;}"
                ]
            }
        }
    ],
    triggers: {
        pipelines: [
            "trigger"
        ]
    }
}

const input = {
    flowInput: {
        parent: [{result:10},{result:11},{result:12},{result:13}]       
    }
}




module.exports = {
    input,
    descriptor
}