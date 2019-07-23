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

    // power: (input) => {
    //     let total = 1

    //     for (let item in input) {
    //         total += Math.pow(item, 2)
    //     }
    //     return total
    // },

    // batch: (input) => {
    //     const arr = []
    //     const min = Math.floor(Math.random() * input[0])
    //     const max = Math.floor(Math.random() * input[0]) + min
    //     for (let i = min; i < max; i++) {
    //         arr.push(i)
    //     }
    //     return arr
    // }
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
            if (batch < 0.2) {
                const ranarr = randomArr()
                const randString = JSON.stringify(ranarr)
                node.input = createInput([`#${randString}`, `@${item}`])
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


const randomArr = () => {
    const r1 = Math.floor(Math.random() * 200) + 1
    const arr = []
    for (let i = 0; i < r1; i++) {
        const r2 = Math.floor(Math.random() * 200) + 1
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