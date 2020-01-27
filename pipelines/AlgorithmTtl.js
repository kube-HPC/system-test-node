const tos = require('../utils/results').toString

const retRange = (input) => {
    const range = Array.from(Array(input[0]).keys());
    return range
}




const descriptor = {
    name: "algorithm-ttl",
    nodes: [
        {
            nodeName: "evalsleep",
            algorithmName: "eval-alg",
            input: [               
                "#@flowInput.inp"
            ],
            ttl:3,
            extraData: {
                code: [
                    "(input,require)=> {",                    
                    "return  new Promise((resolve,reject)=>{setTimeout(()=>resolve(4),input)});}"
                    
                ]
            }
        }
        // ,
        
        // {
        //     nodeName: "node2",
        //     algorithmName: "eval-alg",
        //     input: [
        //         "@evalsleep",
        //         "@flowInput.inp"
               
        //     ],
        //     ttl:0,
        //     extraData: {
        //         code: [
        //             "(input,require)=> {",                    
        //             "return  new Promise((resolve,reject)=>{setTimeout(()=>resolve(4),input)});}"
                    
        //         ]
        //     },
        //     "metrics": {
        //         "tensorboard": true
        //     }
        // }
    ],
    options: {
        ttl: 3600,
        batchTolerance: 80,
        progressVerbosityLevel: "info"
    },

}

const input = {
    flowInput: {
        
        inp: [2000,5000,2000,2000,2000,2000]
    }
}



module.exports = { descriptor, input }