const path = require('path');
const tos = require('../utils/results').toString
const {
    write_log
} = require(path.join(process.cwd(), 'utils/misc_utils'))

const codeMainPipe = (input, self) => {
    const arr = [];
    // write_log(`the input for the pipeline is ${input}`)
    for (let i = 0; i < input.length; i++) {
        let current = input[0][i];
        // write_log(`in the loop ${current}`)
        arr.push(current);
    };
    const subpipe = {
        name: "subForDist",
        flowInput: {
            nums: input[0]
        }
    };

    self.startSubPipeline(
        subpipe
    );

    return arr
}


const descriptor = {
    name: "distMain",
    nodes: [{
        nodeName: "node1",
        algorithmName: "eval-alg",
        input: [
            "@flowInput.nums"
        ],
        extraData: {
            code: [
                tos(codeMainPipe)
            ]
        }
    }]
}

const input = {
    flowInput: {
        nums: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    }
}

const data = [{
    nodeName: 'node1',
    algorithmName: 'eval-alg',
    result: [
        [{
            nodeName: 'dist',
            algorithmName: 'eval-alg',
            result: [
                4,
                8,
                12,
                16,
                20,
                24,
                28,
                32,
                36,
                40
            ]
        }]
    ]
}]


module.exports = {
    descriptor,
    input,
    data
}