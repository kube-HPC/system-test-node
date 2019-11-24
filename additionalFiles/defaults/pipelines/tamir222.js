 const pipe = {
    name: 'tamir222',
    nodes: [{
            nodeName: 'evaladd',
            algorithmName: 'eval-alg',
            input: [
                '@flowInput.addInput'
            ],
            extraData: {
                code: [
                    '(input,require)=> {',
                    'const result = input[0][0]+input[0][1]',
                    'return result;}'
                ]
            }
        },
        {
            nodeName: 'evalmul',
            algorithmName: 'tamir222',
            input: [
                '@evaladd',
                '@flowInput.multInput'
            ],
            extraData: {
                code: [
                    '(input,require)=> {',
                    'const result = input[0] * input[1][0]',
                    'return result;}'
                ]
            }
        }
    ]
}

module.exports = { pipe }
