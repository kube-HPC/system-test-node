const tos = require('../utils/results').toString

const eval_error = (input) => {
    if (input[0] > 10) {
        throw new Error('eval error, dont know what to do')
    } else {
        return 100
    }
}


const descriptor = {
    name: "evalfail",
    nodes: [
        {
            nodeName: "evalfail",
            algorithmName: "eval-alg",
            input: [
            	"@flowInput.addInput"
            ],
            extraData: {
                code: [
                    "(input,require)=> {",
                        "const result= input[0][0]+input[0][1]",
                        "result=100;",
                        "return result;}"
                ]
            }
        }
    ]
}

const input = {
   // name : "evalfail",
    flowInput: {
        addInput:[4,5]},
    options: {
            batchTolerance: 60,
            progressVerbosityLevel: "info"
        }
}


module.exports = {
    descriptor,
    input
}