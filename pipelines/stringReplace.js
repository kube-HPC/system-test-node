const tos = require('../utils/results').toString

const eval_error = (input) => {
    if (input[0] > 10) {
        throw new Error('eval error, dont know what to do')
    } else {
        return 100
    }
}


const descriptor = {
    name: "stringReplace",
    nodes: [
        {
            nodeName: "replace",
            algorithmName: "eval-alg",
            input: [
            	"@flowInput.inputs"
            ],
            extraData: {
                code: [
                    "(input,require)=> {",
                    "const txt = input[0][0];",
                    "const wToChange = input[0][1];",
                    "const toChange = input [0][2];",
                    "const result = txt.replace(wToChange,toChange);",
                    "return result;}"
                ]
            }
        }
    ]
}

const input = {
   // name : "evalfail",
    flowInput: {
        inputs:["hello world","world","earth"]},
    options: {
            batchTolerance: 60,
            progressVerbosityLevel: "info"
        }
}


module.exports = {
    descriptor,
    input
}