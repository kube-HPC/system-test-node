const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')

const { deleteAlgorithm,
    runAlgorithm,
    storeAlgorithmApply,
} = require('../../../utils/algorithmUtils')

const {
    getResult,
} = require('../../../utils/results')



chai.use(chaiHttp);

describe('baseline  version Tests', () => {



    describe('python baseline tests', () => {

        const algJson = (algName, imageName) => {
            let alg = {
                name: algName,
                cpu: 1,
                gpu: 0,
                mem: "256Mi",
                minHotWorkers: 0,
                algorithmImage: imageName,
                type: "Image",
                options: {
                    debug: false,
                    pending: false
                },
                workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 2000 }
            }
            return alg
        }




        it('python 2.7', async () => {
            const algorithmName = "python27"
            const python27 = "tamir321/py27:01"
            const algpython27 = algJson(algorithmName, python27)

            await deleteAlgorithm(algorithmName, true)
            await storeAlgorithmApply(algpython27);
            const alg = {
                name: algorithmName,
                input: [1]
            }
            const res = await runAlgorithm(alg)
            const jobId = res.body.jobId
            const result = await getResult(jobId, 200)
            expect(result.data[0].result).to.be.equal(42)
        }).timeout(1000 * 60 * 5);



        it('python 3.5', async () => {
            const algorithmName = "python35"
            const python35 = "tamir321/py35:01"
            const algpython35 = algJson(algorithmName, python35)

            await deleteAlgorithm(algorithmName, true)
            await storeAlgorithmApply(algpython35);
            const alg = {
                name: algorithmName,
                input: [1]
            }
            const res = await runAlgorithm(alg)
            const jobId = res.body.jobId
            const result = await getResult(jobId, 200)
            expect(result.data[0].result).to.be.equal(42)
        }).timeout(1000 * 60 * 5);

        it('python 3.6', async () => {
            const algorithmName = "python36"
            const python36 = "tamir321/py36:01"
            const algpython36 = algJson(algorithmName, python36)

            await deleteAlgorithm(algorithmName, true)
            await storeAlgorithmApply(algpython36);
            const alg = {
                name: algorithmName,
                input: [1]
            }
            const res = await runAlgorithm(alg)
            const jobId = res.body.jobId
            const result = await getResult(jobId, 200)
            expect(result.data[0].result).to.be.equal(42)
        }).timeout(1000 * 60 * 5);

        it('python 3.7', async () => {
            const algorithmName = "python37"
            const python37 = "tamir321/py37:01"
            const algpython37 = algJson(algorithmName, python37)

            await deleteAlgorithm(algorithmName, true)
            await storeAlgorithmApply(algpython37);
            const alg = {
                name: algorithmName,
                input: [1]
            }
            const res = await runAlgorithm(alg)
            const jobId = res.body.jobId
            const result = await getResult(jobId, 200)
            expect(result.data[0].result).to.be.equal(42)
        }).timeout(1000 * 60 * 5);

        it('python 3.7 -slim', async () => {
            const algorithmName = "python37slim"
            const python37 = "tamir321/py37-slim:02"
            const algpython37 = algJson(algorithmName, python37)

            await deleteAlgorithm(algorithmName, true)
            await storeAlgorithmApply(algpython37);
            const alg = {
                name: algorithmName,
                input: [1]
            }
            const res = await runAlgorithm(alg)
            const jobId = res.body.jobId
            const result = await getResult(jobId, 200)
            expect(result.data[0].result).to.be.equal(42)
        }).timeout(1000 * 60 * 5);


    })



});