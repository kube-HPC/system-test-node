


const descriptor = {
    name: 'biggerThen10evalerror',
    nodes: [{
        nodeName: 'nodeerror',
        algorithmName: 'eval-alg',
        input: [
            '#@flowInput.nums'
        ],
        extraData: {
            code: [
                "(input,require) => {",
                "if (input[0]>10){",
                "throw new Error ('eval error, dont know what to do');}",
                "else{",
                "return 100}}"
            ]
        }
    }]
}

const input = {   
    flowInput: {
        nums: [1,24,3,4,5]
        }
}



module.exports = {
    descriptor,
    input
}