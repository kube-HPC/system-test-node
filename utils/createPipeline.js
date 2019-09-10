const path = require('path');
const tos = require(path.join(process.cwd(), 'utils/results')).toString


const func = {
    add: (input) => {
        let total = 0

        for (let item of input) {
            total += item
        }
        return total

    },

    sub: (input) => {
        let total = 0

        for (let item of input) {
            total -= item
        }
        return total
    },

    div: (input) => {
        let total = 1

        for (let item of input) {
            total /= item
        }
        return total
    },

    mult: (input) => {
        let total = 1

        for (let item of input) {
            total *= item
        }
        return total
    },

    batch: (input) => {
        const arr = []
        const min = Math.floor(Math.random() * input[0])
        const max = Math.floor(Math.random() * input[0]) + min
        for (let i = min; i < max; i++) {
            arr.push(i)
        }
        return arr
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
    const algos = ['eval-alg', 'eval-alg2', 'eval-alg3', 'eval-alg4', 'eval-alg5']
    var item = algos[Math.floor(Math.random() * algos.length)];
    const node = {
        nodeName: name,
        algorithmName: item,
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
        if (i === 0) {
            node.input = createInput([3, 5])
        } else {
            if (batch < 0.2) {
                const ranarr = randomArr()
                const randString = JSON.stringify(ranarr)
                node.input = createInput([`#${randString}`, `@${item}`])
            } else {
                const numInputs = Math.floor(Math.random() * preNodes.length)
                const inputs = [3]
                for (let j = 0; j < numInputs; j++) {
                    const index = Math.floor(Math.random() * numInputs)
                    inputs.push(`@${preNodes[index]}`)
                }
                node.input = createInput(inputs)
            }
        }
        preNodes.push(nodeName)

        nodes.push(node)
    }
    desciptor.nodes = nodes
    const priority = Math.floor(Math.random() * 5) + 1
    desciptor.priority = priority
    return desciptor
}


const randomArr = () => {
    const r1 = Math.floor(Math.random() * 2000) + 1
    const arr = []
    for (let i = 0; i < r1; i++) {
        const r2 = Math.floor(Math.random() * 2000) + 1
        arr.push(r2)
    }

    return arr
}



// desciptor = randomize(10)
// console.log(JSON.stringify(desciptor))
// console.log(desciptor)

module.exports = {
    randomize
}