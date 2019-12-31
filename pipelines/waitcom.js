

const descriptor = {
    name: "waitcom",
    nodes: [
        {
            nodeName: "evalsleep",
            algorithmName: "eval-alg",
            input: [
                "#@flowInput.inputs"
            ],
            extraData: {
                code: [
                    "(input,require)=> {",
                    "var d = new Date();",
                    "var d1 = new Date();",
                    "var d2 = -100;",
                    "var counter = 0;",
                    "while (d2 < input[0]) {",
                        "for (var i = 0; i < 1000; i++) {",
                            "for (var j = 0; j < 10000; j++) {}}",
                                "counter++;",
                                "d1 = new Date();",
                                "var d2 = (d1 - d) / 1000}",
                                "console.log ('im writing log');",
                    "return counter}"
                ]
            }
        }
    ]
}

const input = {
    // name : "evalwait",
     flowInput: {
         inputs:[
             [15000,1]
         ]}
 }


module.exports = {
    descriptor,input
}