const tos = require('../utils/results').toString

const retRange = (input) => {
    const range = Array.from(Array(input[0]).keys());
    return range
}




const descriptor = {
    name: "simpleNoInput",
    nodes: [
        {
            nodeName: "green",
            algorithmName: "eval-alg",
            input: [               
                "flowInput.inp"
            ]
          
        },
        {
            nodeName: "yellow",
            algorithmName: "yellow-alg",
            input: [               
                "#@green"
            ],
            "includeInResults": true
            
        },
        {
            nodeName: "black",
            algorithmName: "black-alg",
            input: [               
                "@yellow"
            ]
          
        }
        
    ],
    options: {
        ttl: 3600,
        batchTolerance: 80,
        progressVerbosityLevel: "info"
    },
    triggers:{
        pipelines:[]
    }

}

const input = {
    flowInput: {        
        inp: [  ]                
    }
}



module.exports = { descriptor, input }