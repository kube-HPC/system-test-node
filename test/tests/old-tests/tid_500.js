const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')



const {
    testData1,

} = require(path.join(process.cwd(), 'config/index')).tid_400


const {
    getJobResult,
    getResult,
    getCronResult,
    getRawGraph,
    getParsedGraph
} = require('../../../utils/results')

const {
    runStoredAndWaitForResults,
    pipelineRandomName,
    deletePipeline,
    storePipeline,
    runStored,
    deconstructTestData,
} = require('../../../utils/pipelineUtils')
chai.use(chaiHttp);

const {
    storeAlgorithmApplay
} = require('../../../utils/algorithmUtils')

describe('TID-500 ', () => {


    it("TID-500 – algorithm name in pipeline not exist", async () => {
        //set test data to testData1
        const pipeline = {
            name: "algTests",
            nodes: [{
                nodeName: "notsuchalgo",
                algorithmName: "notsuchalgo",
                input: [
                    "#@flowInput.inputs"
                ],
                extraData: {
                    code: [
                        "(input,require)=> {",
                        "return new Promise((resolve,reject)=>{setTimeout(()=>resolve(input[0][1]),input[0][0])});}"
                    ]
                }
            }]
        }


        //store pipeline addmuldiv
        const res = await storePipeline(pipeline)
        expect(res.text).includes("algorithm notsuchalgo Not Found");

    }).timeout(1000 * 60 * 5);

    it("TID-510 no input in pipeline descriptors", async () => {
        //set test data to testData1
        const pipeline = {
            name: "green-alg-algTests",
            nodes: [{
                nodeName: "notsuchalgo",
                algorithmName: "green-alg"
            }]
        }

        //store pipeline addmuldiv
        await deletePipeline(pipeline.name)
        const res = await storePipeline(pipeline)
        const jobId = await runStoredAndWaitForResults(pipeline.name)
        const result = await getJobResult(jobId)
        expect(result.body.data[0].result).to.be.equal(42)
    }).timeout(1000 * 60 * 5);

    describe('TID-520 different chars in algorithm and pipeline names ', () => {
        it("pipeline abc-A#", async () => {
            //set test data to testData1
            const pipeline = {
                name: "abc-A#",
                nodes: [{
                    nodeName: "notsuchalgo",
                    algorithmName: "green-alg"
                }]
            }

            const res = await storePipeline(pipeline)
            expect(res.text).includes("pipeline name must contain only alphanumeric, dash, dot or underscore")
        }).timeout(1000 * 60 * 5);

        it("pipeline AA$A", async () => {
            //set test data to testData1
            const pipeline = {
                name: "AA$A",
                nodes: [{
                    nodeName: "notsuchalgo",
                    algorithmName: "green-alg"
                }]
            }

            const res = await storePipeline(pipeline)
            expect(res.text).includes("pipeline name must contain only alphanumeric, dash, dot or underscore")
        }).timeout(1000 * 60 * 5);


        it("pipeline Algorithim A", async () => {
            //set test data to testData1
            const pipeline = {
                name: "AAA",
                nodes: [{
                    nodeName: "notsuchalgo",
                    algorithmName: "A"
                }]
            }

            const res = await storePipeline(pipeline)
            expect(res.text).includes("algorithm name must contain only lower-case alphanumeric, dash or dot")
        }).timeout(1000 * 60 * 5);




        it("Algorithim A", async () => {
            //set test data to testData1
            const alg = {
                name: "A",
                cpu: 1,
                gpu: 0,
                mem: "256Mi",
                minHotWorkers: 0,
                algorithmImage: "tamir321/algoversion:v2",
                type: "Image",
                options: {
                    debug: false,
                    pending: false
                }
            }

            const res = await await storeAlgorithmApplay(alg);
            expect(res.text).includes("algorithm name must contain only lower-case alphanumeric, dash or dot")
        }).timeout(1000 * 60 * 5);

    })



    it("TID-550 empty array as input for a batch", async () => {
        //set test data to testData1
        const pipeline = {
            name: "batchInput",
            nodes: [{
                nodeName: "notsuchalgo",
                algorithmName: "eval-alg",
                input: [
                    "#@flowInput.inputs"
                ],
                extraData: {
                    code: [
                        "(input,require)=> {",
                        "return new Promise((resolve,reject)=>{setTimeout(()=>resolve(input[0]),10000)});}"
                    ]
                }
            }]
        }

        const pipe = {
            name: "batchInput",
            flowInput: {

                inputs: []
            }
        }
        await deletePipeline(pipeline.name)
        await storePipeline(pipeline)
        const jobId = await runStoredAndWaitForResults(pipe)
        const res = await getParsedGraph(jobId)

        expect(res.body.nodes[0].batch[0].status).to.be.equal("skipped")
    }).timeout(1000 * 60 * 5);

});