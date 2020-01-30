


const descriptor = {
    name: "bool",
    nodes: [
        {
            nodeName: "trueFalse",
            algorithmName: "eval-alg",
            input: [
            	"@flowInput.inputs"
            ],
            extraData: {
                code: [
                    "(input,require)=> {",
                    "const txt = input[0];",
                    "return txt;}"
                ]
            }
        }
    ]
}

const input = {
   // name : "evalfail",
    flowInput: {
        inputs:true},
    options: {
            batchTolerance: 60,
            progressVerbosityLevel: "info"
        }
}


module.exports = {
    descriptor,
    input
}