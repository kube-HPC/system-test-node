const chai = require('chai');
const path = require('path');
const chaiHttp = require('chai-http');
const config = require(path.join(process.cwd(), 'config/config'));

const expect = chai.expect;
const assertArrays = require('chai-arrays');

const {
    deletePipeline,
    storePipeline,
    deconstructTestData,
    runStoredAndWaitForResults
} = require('../utils/pipelineUtils');

const { storeAlgorithm } = require('../utils/algorithmUtils');

const {
    getSpansByJodid
} = require('../utils/jaeger');

chai.use(chaiHttp);
chai.use(assertArrays);

const {
    testData2
} = require(path.join(process.cwd(), 'config/index')).jagearTest;

const { loginWithRetry } = require('../utils/misc_utils');

describe('jagear', () => {
    let dev_token;

    before(async function () {
        this.timeout(1000 * 60 * 15);
        dev_token = await loginWithRetry();
    });

    let alg = {
        name: "versatile",
        cpu: 1,
        gpu: 0,
        mem: "256Mi",
        minHotWorkers: 0,
        algorithmImage: "tamir321/versatile:04",
        type: "Image",
        options: {
            debug: false,
            pending: false
        },
        workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 2000 }
    }

    it('test jagear start algorithms', async () => {
        const algName = "black-alg";
        const pipe = {
            name: "simple",
            flowInput: {
                files: {
                    link: "link1"
                }
            },
            priority: 1
        }
        const jobId = await runStoredAndWaitForResults(pipe, dev_token);
        const data = await getSpansByJodid(jobId, dev_token);
        const startsAlgs = ["yellow-alg start", "black-alg start", "green-alg start"];
        const dataOperations = data.map(item => item.operationName).filter((value, index, self) => self.indexOf(value) === index);
        const found = startsAlgs.every(r => dataOperations.includes(r));

        expect(found).to.be.true;
    }).timeout(1000 * 10 * 60);
});

describe.skip('Test worker cache 576', () => { // IF THIS TESTS RETURNS, PLEASE MAKE SURE ALGORITHM AND PIPELINE ARE REMOVED AFTER ITS DONE
    //https://app.zenhub.com/workspaces/hkube-5a1550823895aa68ea903c98/issues/kube-hpc/hkube/576
    it('storage get amount ', async () => {
        const alg = await storeAlgorithm("lonstringv1", dev_token);
        //set test data to testData1
        const d = deconstructTestData(testData2);
        await deletePipeline(d, dev_token);
        //store pipeline evalwait
        await storePipeline(d, dev_token);

        //run the pipeline 
        const jobId = await runStoredAndWaitForResults(d, dev_token);

        const WSdata = await getWorkers(dev_token);
        const pods = WSdata.discovery.worker.filter(worker => worker.algorithmName == "eval-alg");

        const data = await getSpansByJodid(jobId, dev_token);
        let setJobResult = data.filter(obj => obj.operationName.includes("set job result"));
        let storageGet = data.filter(obj => obj.operationName == "storage-get").filter(obj => obj.references.length > 0);

        let wz = storageGet.filter(obj => obj.references[0].spanID != setJobResult[0].spanID);

        const a = Math.abs(pods.length - wz.length / 2);
        expect(a).to.be.lessThan(30);
    }).timeout(1000 * 60 * 5);
});