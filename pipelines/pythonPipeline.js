const tos = require('../utils/results').toString


const retRange = (input) => {
    const range = Array.from(Array(input[0]).keys());
    return range
}


const descriptor = {
    name: "buildPipeline",
    nodes: [{
            nodeName: "evalSplit",
            algorithmName: "eval-alg",
            input: [
                "@flowInput.quantity"
            ],
            extraData: {
                code: [
                    tos(retRange)
                ]
            }
        },
        {
            nodeName: "pyEye",
            algorithmName: "testalg",
            input: [
                "#@evalSplit",
            ]
        }
    ]
}

const input = {
    flowInput: {
        quantity: 3
    }
}

const data = [{
        nodeName: 'pyEye',
        batchIndex: 1,
        algorithmName: 'testalg',
        result: []
    },
    {
        nodeName: 'pyEye',
        batchIndex: 2,
        algorithmName: 'testalg',
        result: [
            [
                1
            ]
        ]
    },
    {
        nodeName: 'pyEye',
        batchIndex: 3,
        algorithmName: 'testalg',
        result: [
            [
                1,
                0
            ],
            [
                0,
                1
            ]
        ]
    }
]


module.exports = {
    input,
    descriptor,
    data
}