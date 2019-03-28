const tos = require('../utils/results').toString

const eval_error = (input) => {
    if (input[0] > 10) {
        throw new Error('eval error, dont know what to do')
    } else {
        return 100
    }
}


const descriptor = {
    name: 'evalerror',
    nodes: [
        {
            nodeName: 'nodeerror',
            algorithmName: 'eval-alg',
            input: [
                '#@flowInput.nums'
            ],
            extraData: {
                code: [
                    tos(eval_error)
                ]
            }
        }
    ]
}

const x = 5


module.exports = { descriptor }


