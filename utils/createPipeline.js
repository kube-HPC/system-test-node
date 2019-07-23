const path = require('path');
const tos = require(path.join(process.cwd(), 'utils/results')).toString


const func = {
    add: (input) => {
        const a = input[0]
        const b = input[1]
        return a + b
    },

    sub: (input) => {
        const a = input[0]
        const b = input[1]
        return a - b
    },

    div: (input) => {
        const a = input[0]
        const b = input[1]
        return a / b
    },

    mult: (input) => {
        const a = input[0]
        const b = input[1]
        return a * b
    },

    power: (input) => {
        const a = input[0]
        const b = input[1]
        return Math.pow(a, b)
    },

    rem: (input) => {
        const a = input[0]
        const b = input[1]
        return a % b
    }
}

let desciptor = {
    name: "randomPipe",
    nodes: []
}

const createInput = (additional) => {
    return additional


}

const createNode = (name, alg) => {
    const node = {
        nodeName: name,
        algorithmName: "eval-alg",
        // input: [
        //     [3, 5]
        // ],
        extraData: {
            code: [
                tos(alg)
            ]
        }
    }

    return node
}

const randomize = (nodesNum) => {
    const keys1 = Object.keys(func)
    const size = keys1.length
    const preNodes = []
    const nodes = []
    for (let i = 0; i < nodesNum; i++) {
        const r = Math.floor(Math.random() * size)
        const k = keys1[r]
        const selected = func[keys1[r]]
        const nodeName = `${k}${i}`
        const node = createNode(nodeName, tos(selected))

        const item = preNodes[Math.floor(Math.random() * preNodes.length)];
        const batch = Math.random()
        // nodes.push(createNode(`${k}${i}`, tos(selected)))
        if (i === 0) {
            node.input = createInput([3, 5])
        } else {
            if (batch < 0.5) {
                node.input = createInput([3, `@${item}`])
            } else {
                node.input = createInput([3, `@${item}`])
            }
        }
        preNodes.push(nodeName)

        nodes.push(node)
    }
    desciptor.nodes = nodes
    return desciptor
}



// desciptor = randomize(2)
// console.log(JSON.stringify(desciptor))
// console.log(desciptor)

module.exports = {
    randomize
}