


const descriptor = {
    name: "evalcron1minutes",
    nodes: [
        {
            nodeName: "evalsleep",
            algorithmName: "eval-alg",
            input: [
            	"flowInput.inputs"
            ],
            extraData: {
                code: [
                    "(input,require)=> {",
                    "const promise = new Promise((resolve)=>{setTimeout(()=>resolve(4),input[1000])});",
                    "return promise.then(value => value + 6);",
                    "}"
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