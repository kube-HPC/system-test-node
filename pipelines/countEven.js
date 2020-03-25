

const descriptor = {
    name: "countEven",
    nodes: [
        {
            nodeName: "even",
            algorithmName: "eval-alg",
            input: [
                "#@flowInput.nums"
            ],
            extraData: {
                code: [
                    "function split(input) {",
                    "return (input[0][0] + input[0][1]) % 2 === 0",
                    "}"
                ]
            }
        },
        {
            nodeName: "count",
            algorithmName: "eval-alg",
            input: [
                "@even"
                
            ],
            extraData: {
                code: [
                    "function count (input) {",
                    "let counter=0",
                    "for (let i=0 ; i<input[0].length ; i++){",
                    "if (input[0][i]){",
                    "counter++}}",
                    "return counter",
                    "}"
                ]
            }
        }
    ]
}

const input = {   
    flowInput: {
        nums:[[2,3],[3,3],[4,4],[676666,4],[566,1],[12335,8989],[2,3],[3,3],[4,4],[1,1]]
      }
}


module.exports = {
    descriptor,
    input
}