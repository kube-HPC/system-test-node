


const descriptor = {
    name: "evalcron1minutes",
    nodes: [
        {
            nodeName: "evalsleep",
            algorithmName: "eval-alg",
            input: [
            	"@flowInput.inputs"
            ],
            extraData: {
                code: [
                    "(input,require)=> {",
                    "return new Promise((resolve,reject)=>{setTimeout(()=>resolve(4),input[0])});}"
                ]
            }
        }
    ]
    ,
        triggers: {
            cron: {
                pattern: "*/1 * * * *",
                enabled: true
            }}
}

const input = {
   // name : "evalfail",
    flowInput: {
        inputs:[
        10000
    ]},
    options: {
            batchTolerance: 60,
            progressVerbosityLevel: "info"
        }
}


module.exports = {
    descriptor,
    input
}