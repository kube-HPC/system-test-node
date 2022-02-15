const tos = require('../utils/results').toString




const descriptor = {
    name: "output-piprline",
    nodes: [
        {
            nodeName: "green",
            algorithmName: "green-alg",
            input: [
                "@flowInput.a"
            ],
            kind: "algorithm"
        },
        {
            nodeName: "yellow",
            algorithmName: "yellow-alg",
            input: [
                "@flowInput.b",
                "@green"
            ],
            kind: "algorithm"
        },
        {
            nodeName: "black",
            algorithmName: "black-alg",
            input: [
                "@flowInput.c",
                "@yellow"
            ],
            kind: "algorithm"
        },
        {
            nodeName: "output",
            kind: "output",
            input: [
                "@yellow",
                "@green"
            ]
        }
    ]
   
    
}

const input = {
  
    flowInput: {
        "a": 42,
        "b": "yellow-input",
        "c": "black-input"},
    
}


module.exports = {
    descriptor,
    input
}