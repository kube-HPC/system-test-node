const tos = require('../utils/results').toString

const codeMainPipe = (input, self) => {
    const arr = [];

    for (let i = 0; i < input.length; i++) {
        let current = input[i];
        arr.push(current);
    };
    const subpipe = {
        name: "subForDist"
    };

    self.startSubPipeline({
        subpipe
    });
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


module.exports = {
    descriptor,
    input
}