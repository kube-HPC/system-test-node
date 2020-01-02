const tos = require('../utils/results').toString

const retRange = (input) => {
    const range = Array.from(Array(input[0]).keys());
    return range
}




const descriptor = {
    name: "algorithm-version-test",
    nodes: [
        
        {
            nodeName: "long-string",
            algorithmName: "algorithm-version-test",
            input: [
                "@flowInput.inp"
            ],
            
            "metrics": {
                "tensorboard": true
            }
        }
    ],
}

const input = {
    flowInput: {
        
        inp: 2000
    }
}



module.exports = { descriptor, input }