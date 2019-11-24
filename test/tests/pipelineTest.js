const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const path = require('path');
const config = require(path.join(process.cwd(), 'config/config'));
const chaiHttp = require('chai-http');
const assertArrays = require('chai-arrays');
const fs = require('fs');

const delay = require('delay');

const {
    getAlgorithim,
    storeAlgorithm,
} = require(path.join(process.cwd(), 'utils/algorithimsUtils'))


const {
    storePipeline,
    getPipeline,
    storeNewPipeLine
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))

const tos = require(path.join(process.cwd(), 'utils/results'.toString()))
// const testData2 = require ('../../pipelines/multadd')
chai.use(chaiHttp);

chai.use(assertArrays);



describe('Pipline test', () => {
    it('algorithim', async () => {
        const alg = {
            name: "tamirrrrrrrrrrrr",
            cpu: 1,
            gpu: 0,
            minHotWorkers: 0,
            options: {
                debug: false,
                pending: false
            },
            algorithmImage: "eytang/versatile-alg:v1.6",
            mem: "256Mi",
            type: "Image",
            memReadable: "256Mi"
        }
        const res = await chai.request(config.apiServerUrl)
            .post('/store/algorithms/apply')
            .field('payload', JSON.stringify(alg))
        //const store = await storeAlgorithime(alg)

    }).timeout(1000 * 60 * 5);

    it('sfdsf',async()=>{
        await storeNewPipeLine('tamir222')
    }).timeout(1000 * 60 * 5);
    it('first Try', async () => {
        const name = 'tamir222'
        const Pipline = await getPipeline(name)
        if (Pipline.status === 404) {
            console.log("pipe was not found")
            const { pipe } = require(path.join(process.cwd(), `additionalFiles/defaults/pipelines/${name}`.toString()))
            
            const array = pipe.nodes.map(async (element) => {
                const algName = element.algorithmName
                const res = await getAlgorithim(algName)
                console.log(res.status + " " + algName)
                if (res.status === 404) {
                    const { alg } = require(path.join(process.cwd(), `additionalFiles/defaults/algorithms/${algName}`.toString()))
                    const store = await storeAlgorithm(alg)
                }
            })
            await Promise.all(array);
            const res1 = await chai.request(config.apiServerUrl)
                .post('/store/pipelines')
                .send(pipe);

        }
        const NewPipline = await getPipeline(name)       

    }).timeout(1000 * 60 * 5);
})

