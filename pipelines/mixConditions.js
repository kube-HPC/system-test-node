const tos = require('../utils/results').toString




const descriptor = {
    name: "mixCondition",
    nodes: [
        {
            nodeName: "black",
            algorithmName: "black-alg",
            input: [
                "@green",
                "#@yellow",
                "*@green2"
            ]
        },
        {
            nodeName: "green",
            algorithmName: "green-alg",
            input: [
                "@flowInput.files.green"
            ]
        },
        {
            nodeName: "yellow",
            algorithmName: "yellow-alg",
            input: [
                "@flowInput.files.yellow"
            ]
        },
        {
            nodeName: "green2",
            algorithmName: "green-alg",
            input: [
                "#@flowInput.files.red"
            ]
        }
    ],
}

const input = {
   
    flowInput: {
        
            files: {
                green: [
                    "links-1",
                    "links-2",
                    "links-3",
                    "links-4",
                    "links-5"
                ],
                yellow: [
                    "links-6",
                    "links-7",
                    "links-8",
                    "links-9",
                    "links-10"
                ],
                red: [
                    "links-6",
                    "links-7",
                    "links-8",
                    "links-9",
                    "links-10"
                ]
            }}
}


module.exports = {
    descriptor,
    input
}