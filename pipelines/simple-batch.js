const tos = require('../utils/results').toString




const descriptor = {
    name: "simple-batch",
    nodes: [
        {
            "nodeName": "green",
            "algorithmName": "eval-alg",
            "kind": "algorithm",
            "input": [],
            "includeInResults": true
        },
        {
            "nodeName": "yellow",
            "algorithmName": "yellow-alg",
            "input": [
                "@green",
                "#@flowInput.inp"
            ],
            "includeInResults": true,
            "kind": "algorithm"
        },
        {
            "nodeName": "black",
            "algorithmName": "black-alg",
            "input": [
                "@yellow"
            ],
            "kind": "algorithm"
        }
    ]
}

const input = {   
    flowInput: {
        inp: null
      }
}


module.exports = {
    descriptor,
    input
}