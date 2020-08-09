const tos = require('../utils/results').toString

const retRange = (input) => {
    const range = Array.from(Array(input[0]).keys());
    return range
}




const descriptor = {
    name: "DropPipeSingel",
    nodes: [
        {
            nodeName: "evalsleep",
            algorithmName: "eval-alg",
            input: [               
                "@flowInput.inp"
            ],
            extraData: {
                code: [
                    "(input,require)=> {",                    
                    "return  new Promise((resolve,reject)=>{setTimeout(()=>resolve(4),input)});}"
                    
                ]
            }
        },
        
        {
            nodeName: "algo-test",
            algorithmName: "eval-alg",
            input: [
                "@evalsleep",
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