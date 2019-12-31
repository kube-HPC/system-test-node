const path = require('path')
const tos = require(path.join(process.cwd(), 'utils/results')).toString


const arr = (input) => {
    const range = Array.from(Array(input[0]).keys())
    return range
}

const wait = (input) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(4), input[1])
    });

}

const pipe = {
    name: 'eval-dynamic',
    nodes: [{
            nodeName: 'eval1',
            algorithmName: 'eval-alg',
            input: [
                '@flowInput.range'
            ],
            extraData: {
                code: [
                    tos(arr)
                ]
            }
        },
        {
            nodeName: 'evalsleep',
            algorithmName: 'eval-alg2',
            input: [
                '#@eval1',
                '@flowInput.time'
            ],
            extraData: {
                code: [
                    tos(wait)
                ]
            }
        }
    ],
    options: {
        batchTolerance: 100,
        progressVerbosityLevel: 'debug'
    }
}

module.exports = {
    pipe
}