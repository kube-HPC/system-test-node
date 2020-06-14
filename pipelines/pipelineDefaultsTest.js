const tos = require('../utils/results').toString

const retRange = (input) => {
    const range = Array.from(Array(input[0]).keys());
    return range
}




const descriptor = {
    name: "DefaultsTest",
    experimentName: "main",
    nodes: [
        {
            nodeName: "green",
            algorithmName: "eval-alg",
            input: [    "1"           
                // "#@flowInput.inp"
            ]
          
        },
        {
            nodeName: "yellow",
            algorithmName: "yellow-alg",
            input: [               
                "#@green.0"
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
    flowInput: {        
        inp: [  "1","2","3","4","5","6", "7","8","9"]                
    },
    options: {
        ttl: 800,
        batchTolerance: 60,
        progressVerbosityLevel: "error",
        concurrentPipelines:{amount:7,
            rejectOnFailure: false}
    },
    priority: 1,
    triggers:{
        pipelines:[],
        cron: {
            pattern: "*/1 * * * *",
            enabled: false
        }
    }

}

const input = {
    flowInput: {        
        inp: [  "1","2","3","4","5","6", "7"]                
    }
}



module.exports = { descriptor, input }