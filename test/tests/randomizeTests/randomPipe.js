const chai = require('chai')
const path = require('path')
const chaiHttp = require('chai-http')
const {
    getResult,
} = require(path.join(process.cwd(), 'utils/results'))

const {
    randomize
} = require(path.join(process.cwd(), 'utils/createPipeline'))

chai.use(chaiHttp);
const {
    runRaw
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))
const {
    write_log
} = require(path.join(process.cwd(), 'utils/misc_utils'))

describe('randomize tests', () => {
    it('randomize a pipeline and get its result', async () => {

        const randPipe = randomize(10)
        const res = runRaw(randPipe)
        res.should.have.status(200)
        const jobId = res.body.jobId
        const result = await getResult(jobId, 200)
        write_log(jobId)
    }).timeout(1000 * 60 * 5)


    it('Run multiple random pipelines', async () => {

        for (let i = 0; i < 5; i++) {
            const randPipe = randomize(10)
            const res = runRaw(randPipe)
            res.should.have.status(200)
            const jobId = res.body.jobId
        }

    }).timeout(1000 * 60 * 5)


    it('randomize pipeline without eval', async () => {
        const algos = ['multpy', 'subpy', 'addpy']
        const descriptor = {
            name: "randomPipe",
            nodes: []
        }

        const preNodes = []

        for (let i = 0; i < 10; i++) {
            const num = Math.floor(Math.random() * algos.length)
            const algName = algos[num]
            const newNode = addNode(`${algName}${i}`, algName, preNodes)
            preNodes.push(newNode.nodeName)
            descriptor.nodes.push(newNode)
        }

        const res = runRaw(descriptor)

        res.should.have.status(200)
        const jobId = res.body.jobId
        const result = await getResult(jobId, 200)

        write_log(jobId)

    }).timeout(1000 * 60 * 5)
})


const addNode = (name, algName, preNodes) => {

    const num = Math.floor(Math.random() * preNodes.length)
    let pre = preNodes[num]
    let input
    if (pre != undefined) {
        input = [
            `@${pre}`, 3, 5
        ]
    } else {
        input = [
            3, 5
        ]
    }
    const node = {
        nodeName: name,
        algorithmName: algName,
        input: input

    }
    return node
}