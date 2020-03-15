

const descriptor = {
    name: "trigger",
    nodes: [{
            nodeName: "evaladd20",
            algorithmName: "eval-alg",
            input: [
                "#@flowInput.addInput"
            ],
            extraData: {
                code: [
                    "(input,require)=> {",
                    "const result = Number(input[0])+20",
                    "return result;}"
                ]
            }
        }
    ]
}

const input = {
    flowInput: {
        addInput: [[1],[2],[3],[4],[5],[6],[7],[8],[9],[0]]       
    }
}




module.exports = {
    input,
    descriptor
}