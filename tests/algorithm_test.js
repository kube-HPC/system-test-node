const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')
const config = require('../config/config');
const { StatusCodes } = require('http-status-codes');
require('./processEvent')

const {
    runAlgorithm,
    deleteAlgorithm,
    getAlgorithm,
    getAlgorithmVersion,
    updateAlgorithmVersion,
    storeAlgorithmApply,
    deleteAlgorithmVersion,
    buildAlgorithmAndWait,
    tagAlgorithmVersion,
    getAlgVersion,
    storeAlgorithms,
    storeOrUpdateAlgorithms,
    deleteAlgorithmJobs,
    deleteAlgorithmPods,
    normalizeCpuValue,
    runAlgGetResult
} = require('../utils/algorithmUtils')

const {
    filterPodsByName,
    getNodes,
    getPodNode,
    getPodSpecByContainer
} = require('../utils/kubeCtl')

const {
    testData1,
    testData4,
    testData3
} = require('../config/index').algorithmTest

const {
    stayUpAlg
} = require('../additionalFiles/defaults/algorithms/stayup.js')

const {
    statelessPipe
} = require("../config/index").deletePodsJobsTest;

const {
    getResult,
    getRawGraph,
    getStatusall
} = require('../utils/results')

// // const KubernetesClient = require('@hkube/kubernetes-client').Client;
const {
    runRaw,
    deletePipeline,
    getPipeline,
    getPipelineStatus,
    storePipeline,
    runStored,
    deconstructTestData,
    runStoredAndWaitForResults,
    stopPipeline
} = require('../utils/pipelineUtils')

const {
    pipelineRandomName
} = require('../utils/pipelineUtils')

const {
    intervalDelay
} = require('../utils/misc_utils');

chai.use(chaiHttp);

const algJson = (algName, imageName, algMinHotWorkers = 0, algCPU = 0.001, algGPU = 0, algMEMORY = "32Mi") => {
    return {
        name: algName.toLowerCase(),
        algorithmImage: imageName,
        minHotWorkers: algMinHotWorkers,
        cpu: algCPU,
        gpu: algGPU,
        mem: algMEMORY,
        type: "Image",
        options: {
            debug: false,
            pending: false
        },
        workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 2000 }
    }
};

const { waitForWorkers, getJobsByNameAndVersion, getJobById, getAllAlgorithms } = require('../utils/socketGet')
describe('Algorithm Tests', () => {
    let testUserBody;
    before(async function () {
        this.timeout(1000 * 60 * 15);
        testUserBody = {
            username: config.keycloakDevUser,
            password: config.keycloakDevPass
        }
        const response = await chai.request(config.apiServerUrl)
            .post('/auth/login')
            .send(testUserBody)

        if (response.status === StatusCodes.OK) {
            console.log('dev login success');
            dev_token = response.body.data.access_token;
        }
        else {
            console.log('dev login failed - no keycloak/bad credentials');
        }
    });
    let dev_token;
    let algList = [];
    let selectedNodeAlgName = "";

    // Use one of the following methods to apply algorithms, as these methods ensure that the algorithms are inserted into the algList.
    // This, in turn, guarantees that no unnecessary data is left behind by properly removing those algorithms.
    const applyAlg = async (alg, token = {}) => {
        await deleteAlgorithm(alg.name, token, true);
        if (!algList.includes(alg.name)) {
            algList.push(alg.name);
        }
        const res = await storeAlgorithmApply(alg, token);
        return res;
    }

    const applyAlgList = async (givenAlgList, token = {}, shouldDelete = false) => {
        await Promise.all(givenAlgList.map(async (alg) => {
            if (shouldDelete) await deleteAlgorithm(alg.name, token, true);
            if (!algList.includes(alg.name)) {
                algList.push(alg.name);
            }
        }));
        const res = await storeAlgorithms(givenAlgList, token);
        return res;
    }

    const applyOrUpdateAlgList = async (givenAlgList, token = {}) => {
        await Promise.all(givenAlgList.map(async (alg) => {
            if (!algList.includes(alg.name)) {
                algList.push(alg.name);
            }
        }));
        const res = await storeOrUpdateAlgorithms(givenAlgList, token);
        return res;
    }
    // End of apply algorithms section

    beforeEach(function () {
        console.log('\n-----------------------------------------------\n');
    });

    afterEach(async function () { // after each to zero the number of hot-workers
        this.timeout(2 * 60 * 1000);
        if (algList.length === 0) return;
        console.log("algList = " + algList);
        j = 0;
        z = 3;

        while (j < algList.length) {
            delAlg = algList.slice(j, z);
            const del = delAlg.map((e) => {
                return deleteAlgorithm(e, dev_token, true);
            });
            console.log("delAlg-", JSON.stringify(delAlg, null, 2));
            const delResult = await Promise.all(del);
            delResult.forEach(result => {
                if (result && result.text) {
                    try {
                        const parsedText = JSON.parse(result.text);
                        if (parsedText.message) {
                            console.log("Delete Result Message:", parsedText.message);
                        }
                    }
                    catch (error) {
                        console.error(result.error.message || error);
                    }
                }
            });
            await delay(2000);
            j += 3;
            z += 3;
            console.log("j=" + j + ",z=" + z);
        }
        algList = []; // Since it rans after EACH test. Need to clear the list!
    });

    after(function () {
        console.log("----------------------- end -----------------------");
    });

    it("get nodes", async () => {
        console.log("~~~~~~~~~~~~get nodes~~~~~~~~~~~~");
        console.log("K8S_CONFIG_PATH - " + process.env.K8S_CONFIG_PATH);
        console.log("BASE_URL - " + process.env.BASE_URL);
        const nodes = await getNodes();
        console.log("node 0 - " + nodes[0]);
    }).timeout(1000 * 60 * 5);

    describe('TID 480 - Test Algorithm ttl (git 61 342)', () => {
        // p1
        it('ttl = 3 one of the inputs = 5 seconds ', async () => {
            const d = deconstructTestData(testData3);
            await deletePipeline(d, dev_token);
            await storePipeline(d, dev_token);
            const jobId = await runStoredAndWaitForResults(d, dev_token);
            const graph = await getRawGraph(jobId, dev_token);
            const nodesStatus = graph.body.nodes[0].batch;
            const nodesError = nodesStatus.filter(obj => obj.error == "Algorithm TTL expired");
            expect(nodesError.length).to.be.equal(1);
            await deletePipeline(d, dev_token);
        }).timeout(1000 * 60 * 5);

        it('ttl =0 one of the inputs = 5 seconds', async () => {
            const d = deconstructTestData(testData3);
            await deletePipeline(d, dev_token);
            d.pipeline.nodes[0].ttl = 0;
            await storePipeline(d, dev_token);
            const jobId = await runStoredAndWaitForResults(d, dev_token);
            const graph = await getRawGraph(jobId, dev_token);
            const nodesStatus = graph.body.nodes[0].batch;
            const nodesError = nodesStatus.filter(obj => obj.error == "Algorithm TTL expired");
            expect(nodesError.length).to.be.equal(0);
            await deletePipeline(d, dev_token);
        }).timeout(1000 * 60 * 5);
    })

    describe('Test Algorithm unscheduledReason', () => {
        const maxCPU = 8;
        const minMem = "4Mi";
        const algorithmBaseName = 'algo-is-satisfied';
        const algorithmImage = 'hkube/algorithm-example-python'; // output is first element of the array which given as input.
        const algorithmSatisfied = algJson(`${algorithmBaseName}-true-${pipelineRandomName(4).toLowerCase()}`, algorithmImage, 0, 0, 0, minMem);
        const algorithmNotSatisfied = algJson(`${algorithmBaseName}-false-${pipelineRandomName(4).toLowerCase()}`, algorithmImage, 0, maxCPU, 0, minMem);

        it('should run algorithm and verify it has no unscheduledReason', async () => {
            const algorithm = { name: algorithmSatisfied.name, input: [] };
            await applyAlg(algorithmSatisfied, dev_token);
            await runAlgorithm(algorithm, dev_token);
            await intervalDelay("Waiting", 45000, 2500);
            const allAlgorithms = await getAllAlgorithms(dev_token);
            const algo = allAlgorithms.find(algo => algo.name === algorithm.name);
            if (!algo) {
                throw new Error(`Algorithm ${algorithm.name} not found`);
            }
            expect(algo.unscheduledReason).to.be.null;
        }).timeout(1000 * 60 * 5);

        it('should run algorithm and verify it has an unscheduledReason', async () => {
            const algorithm = { name: algorithmNotSatisfied.name, input: [] };
            await applyAlg(algorithmNotSatisfied, dev_token);
            await runAlgorithm(algorithm, dev_token);
            await intervalDelay("Waiting", 45000, 2500);
            const allAlgorithms = await getAllAlgorithms(dev_token);
            const algo = allAlgorithms.find(algo => algo.name === algorithm.name);
            if (!algo) {
                throw new Error(`Algorithm ${algorithm.name} not found`);
            }
            expect(algo.unscheduledReason).to.be.a('string');
        }).timeout(1000 * 60 * 5);

        const resources = { 
            limits: { cpu: 8, memory: '512Mi' },
            requests: { cpu: 4, memory: '256Mi' }
        };
        const sideCars = [{
            container: { name: 'mycar', image: 'redis', resources }
        }];
        const baseDescription = "should build warning correctly for unscheduled algorithm ";
        const cases = [
            { description: "" },
            { description: "with custom resources ", workerCustomResources: resources },
            { description: "with sidecars ", sideCars }, 
            { description: "with custom resources and sidecars ", workerCustomResources: resources, sideCars }
        ];
        const totalCpuToRequest = 12;
        const maxAllowedCPU = 8
        const workerDefaultCpu = 0.1;

        cases.forEach(({ description, ...additionalProps }, index) => {
            it(baseDescription + description, async () => {
                const { workerCustomResources, sideCars } = additionalProps;
                const workerCPU = workerCustomResources ? workerCustomResources.requests.cpu : workerDefaultCpu;
                const sideCarsCPU = sideCars ? sideCars.reduce((sum, sc) => sum + (sc.container.resources ? sc.container.resources.requests.cpu : 0), 0) : 0;
                const algCPU = Math.min(maxAllowedCPU, totalCpuToRequest - workerCPU - sideCarsCPU);
                expect(algCPU).to.be.greaterThan(0, "Test case setup error: totalCpuToRequest is less than or equal to the sum of other components' CPU requests.");
                const name = `unscheduled-resources-${pipelineRandomName(4).toLowerCase()}-${index}`;
                const algorithm = algJson(name, algorithmImage, 0, algCPU, undefined, undefined);
                algorithm.workerCustomResources = workerCustomResources;
                algorithm.sideCars = sideCars;
                const actualRequestedCPU = algCPU + workerCPU + sideCarsCPU;

                await applyAlg(algorithm, dev_token);
                const res = await runAlgorithm({ name, input: [] }, dev_token);
                const { jobId } = res.body;
                
                await intervalDelay("Waiting for warning to create", 60 * 1000, 5000);
                const { job } = await getJobById(dev_token, jobId);
                const allAlgorithms = await getAllAlgorithms(dev_token);
                const testAlgo = allAlgorithms.find(a => a.name === algorithm.name);
                const unscheduledReason = `Maximum capacity exceeded cpu (3)`;
                const errorMessage = `Maximum capacity exceeded cpu (3)\nYour total request of cpu = ${actualRequestedCPU} is over max capacity of 8.\nCheck algorithm, worker and sideCars resource requests.`;

                expect(testAlgo).to.not.be.undefined;
                expect(testAlgo.unscheduledReason).to.equal(unscheduledReason);
                expect(job.graph.nodes[0].status).to.equal('failedScheduling');
                expect(job.graph.nodes[0].error).to.equal(errorMessage);
            }).timeout(1000 * 60 * 5);
        });

        describe('algorithm with volumes tests', () => {
            const volumeTypes = {
                pvc: {
                    name: "pvc-volume-no-exist",
                    persistentVolumeClaim: {
                        claimName: "non-existing-pvc"
                    }
                },
                configMap: {
                    name: "configmap-volume-no-exist",
                    configMap: {
                        name: "non-existing-configMap"
                    }
                },
                secret: {
                    name: "secret-volume-no-exist",
                    secret: {
                        secretName: "non-existing-secret"
                    }
                }
            }

            Object.entries(volumeTypes).forEach(([key, volume]) => {
                it(`should fail creating an algorithm with a non-existing ${key} and create a warning`, async () => {
                    const algName = `non-existing-${key}-${pipelineRandomName(4).toLowerCase()}`;
                    const alg = algJson(algName, algorithmImage);
                    alg.volumes = [volume];

                    await applyAlg(alg, dev_token);
                    const res = await runAlgorithm({ name: alg.name, input: [] }, dev_token);
                    const { jobId } = res.body;

                    await intervalDelay("Waiting for warning to create", 80 * 1000, 10000);
                    const { job } = await getJobById(dev_token, jobId);
                    const allAlgorithms = await getAllAlgorithms(dev_token);
                    const testAlgo = allAlgorithms.find(a => a.name === alg.name);
                    const errorMessage = `One or more volumes are missing or do not exist.\nMissing volumes: non-existing-${key}`;

                    expect(testAlgo).to.not.be.undefined;
                    expect(testAlgo.unscheduledReason).to.equal(errorMessage);
                    expect(job.graph.nodes[0].status).to.equal('failedScheduling');
                    expect(job.graph.nodes[0].error).to.equal(errorMessage);
                }).timeout(1000 * 60 * 5);
            });

            it('should fail creating an algorithm with more than one non-existing volumes and create a warning', async () => {
                const algName = `non-existing-volumes-${pipelineRandomName(4).toLowerCase()}`;
                const alg = algJson(algName, algorithmImage);
                alg.volumes = Object.values(volumeTypes);

                await applyAlg(alg, dev_token);
                const res = await runAlgorithm({ name: alg.name, input: [] }, dev_token);
                const { jobId } = res.body;

                await intervalDelay("Waiting for warning to create", 80 * 1000, 10000);
                const { job } = await getJobById(dev_token, jobId);
                const allAlgorithms = await getAllAlgorithms(dev_token);
                const testAlgo = allAlgorithms.find(a => a.name === alg.name);
                const errorMessage = 'One or more volumes are missing or do not exist.\nMissing volumes: non-existing-pvc, non-existing-configMap, non-existing-secret';

                expect(testAlgo).to.not.be.undefined;
                expect(testAlgo.unscheduledReason).to.equal(errorMessage);
                expect(job.graph.nodes[0].status).to.equal('failedScheduling');
                expect(job.graph.nodes[0].error).to.equal(errorMessage);
            }).timeout(1000 * 60 * 5);

            it('should successfully run an algorithm with a valid emptyDir volume and volume mount', async () => {
                const algName = `mounts-volume-${pipelineRandomName(4).toLowerCase()}`;
                const alg = algJson(algName, algorithmImage);
                alg.volumes = [{
                    name: 'my-dir',
                    emptyDir: {}
                }];
                alg.volumeMounts = [{
                    name: 'my-dir',
                    mountPath: '/tmp/foo'
                }];

                await applyAlg(alg, dev_token);
                const result = await runAlgGetResult(alg.name, [6], dev_token);

                expect(result.status).to.equal('completed');
                expect(result.data[0].result).to.be.equal(6);
            }).timeout(1000 * 60 * 5);

            it('should successfully create a pod with a shared volume for algorunner and sidecar', async () => {
                const algName = `mounts-shared-volume-${pipelineRandomName(4).toLowerCase()}`;
                const alg = algJson(algName, algorithmImage);
                alg.volumes = [{
                    name: 'my-dir',
                    emptyDir: {}
                }];
                alg.volumeMounts = [{
                    name: 'my-dir',
                    mountPath: '/tmp/foo'
                }];
                alg.sideCars = [{
                    container: {
                        name: 'mycar',
                        image: 'redis'
                    },
                    volumeMounts: [{
                        name: 'my-dir',
                        mountPath: '/tmp/foo'
                    }]
                }];

                await applyAlg(alg, dev_token);
                await runAlgGetResult(alg.name, [6], dev_token);
                const pod = await filterPodsByName(alg.name)
                const { spec } = pod[0];

                expect(spec.volumes).to.deep.contain({ name: 'my-dir', emptyDir: {} });
                expect(spec.containers[1].name).to.equal('algorunner');
                expect(spec.containers[1].volumeMounts).to.deep.contain({ name: 'my-dir', mountPath: '/tmp/foo' });
                expect(spec.containers[2].name).to.equal('mycar');
                expect(spec.containers[2].volumeMounts).to.deep.contain({ name: 'my-dir', mountPath: '/tmp/foo' });
            }).timeout(1000 * 60 * 5);

            it('should fail creating a pod with an invalid volumeMounts', async () => {
                const algName = `mounts-invalid-mount-${pipelineRandomName(4).toLowerCase()}`;
                const alg = algJson(algName, algorithmImage);
                alg.volumeMounts = [{
                    name: 'non-exist',
                    mountPath: '/tmp/foo'
                }];

                await applyAlg(alg, dev_token);
                const res = await runAlgorithm({ name: alg.name, input: [] }, dev_token);
                const { jobId } = res.body;

                await intervalDelay("Waiting for warning to create", 80 * 1000, 10000);
                const { job } = await getJobById(dev_token, jobId);
                const allAlgorithms = await getAllAlgorithms(dev_token);
                const testAlgo = allAlgorithms.find(a => a.name === alg.name);
                const errorMessage = 'Kubernetes Job is invalid: algorunner.volumeMounts[3].name: Not found: non-exist';

                expect(testAlgo).to.not.be.undefined;
                expect(testAlgo.unscheduledReason).to.equal(errorMessage);
                expect(job.graph.nodes[0].status).to.equal('failedScheduling');
                expect(job.graph.nodes[0].error).to.equal(errorMessage);
            }).timeout(1000 * 60 * 5);
        });
    });

    describe('Test Algorithm Version (git 560 487 998)', () => {
        //https://app.zenhub.com/workspaces/hkube-5a1550823895aa68ea903c98/issues/kube-hpc/hkube/560
        const algorithmName = `algorithm-version-test-${pipelineRandomName(4).toLowerCase()}`;
        const algorithmImageV1 = "tamir321/algoversion:v1";
        const algorithmImageV2 = "tamir321/algoversion:v2";

        afterEach(async function () {
            if ((this.currentTest.title === "update algorithm nodeSelector") && (this.currentTest.state === 'failed')) {
                console.log(`After ${this.currentTest.title} failure - `);
                if (this.currentTest.timedOut) {
                    console.log(`failed due to test total timeout`);
                }
                try {
                    const discovery = await chai.request(config.apiServerUrl)
                        .get(`/resources/unscheduledalgorithms/${selectedNodeAlgName}`)
                        .set('Authorization', `Bearer ${dev_token}`);
                    if (discovery.status === StatusCodes.OK) {
                        console.log(`Reason for the unschedualing of alg after node selector : ${discovery.body.message}\n`);
                        const amountMissing = discovery.body.complexResourceDescriptor.nodes[0].amountsMissing;
                        let resourceMissingMessage = '';
                        Object.entries(amountMissing).forEach(([k, v]) => {
                            resourceMissingMessage += `${k} : ${v}, `;
                        });
                        console.log(`Missing resources : ${resourceMissingMessage}`);
                    }
                    else {
                        console.log(`Api server response ${discovery.status} ${discovery.body}`);
                    }
                } catch (error) {
                    console.log(error);
                }
            }
        });

        const algorithmV1 = algJson(algorithmName, algorithmImageV1);
        const algorithmV2 = algJson(algorithmName, algorithmImageV2);
        const d = deconstructTestData(testData1);
        d.pipeline.nodes[0].algorithmName = algorithmName;
        //store pipeline

        it('algorithm change creates a new version', async () => {
            let v1 = await applyAlg(algorithmV1, dev_token);
            algorithmV1.algorithmEnv = { "FOO": "123456" };
            let v2 = await storeAlgorithmApply(algorithmV1, dev_token);
            const algVersion2 = await getAlgorithmVersion(algorithmName, dev_token);
            expect(algVersion2.body.length).to.be.equal(2);
            let alg = await getAlgorithm(algorithmName, dev_token);
            expect(JSON.parse(alg.text).version).to.be.equal(v1.body.algorithm.version);
            await updateAlgorithmVersion(algorithmName, v2.body.algorithm.version, dev_token, true);
            alg = await getAlgorithm(algorithmName, dev_token);
            expect(JSON.parse(alg.text).algorithmEnv.FOO).to.be.equal('123456');
            expect(alg.body.auditTrail.length).to.be.eql(2);
            expect(alg.body.auditTrail[0].timestamp).to.be.gt(alg.body.auditTrail[1].timestamp);
            expect(alg.body.auditTrail[1].version).to.eql(v1.body.algorithm.version)
            expect(alg.body.auditTrail[0].version).to.eql(v2.body.algorithm.version);
            if (dev_token) {
                expect(algVersion2.body[0].createdBy).to.be.eql(testUserBody.username);
            }
        }).timeout(1000 * 60 * 10);

        it('algorithm version can have tag', async () => {
            const v1 = await applyAlg(algorithmV1, dev_token);

            await tagAlgorithmVersion(algorithmName, v1.body.algorithm.version, "myTag1", dev_token);
            const v1Tag = await getAlgVersion(algorithmName, v1.body.algorithm.version, dev_token);
            algorithmV1.cpu = 2;
            const v2 = await storeAlgorithmApply(algorithmV1, dev_token);
            const algVersion2 = await getAlgorithmVersion(algorithmName, dev_token);
            expect(algVersion2.body.length).to.be.equal(2);
            await tagAlgorithmVersion(algorithmName, v2.body.algorithm.version, "myTag2", dev_token);
            const v2Tag = await getAlgVersion(algorithmName, v2.body.algorithm.version, dev_token);

            expect(JSON.parse(v1Tag.text).tags[0]).to.be.equal("myTag1");
            expect(JSON.parse(v2Tag.text).tags[0]).to.be.equal("myTag2");
        }).timeout(1000 * 60 * 10);

        it('algorithm lablels does not overwrite defaults', async () => {
            const algName = pipelineRandomName(8).toLowerCase();
            const algV1 = algJson(algName, algorithmImageV1);
            // const algV2 = algJson(algName,algorithmImageV2)
            // algV1.nodeSelector = {"kubernetes.io/hostname": nodes[2] }
            algV1.minHotWorkers = 1; // get a pod running
            algV1.labels = { "group": "test" }

            await applyAlg(algV1, dev_token);
            let times = 0;
            let pods = [];
            while (pods.length === 0 && times < 15) {
                await delay(1000);
                pods = await filterPodsByName(algName) || [];
                times++;
            }
            expect(pods.length).to.be.greaterThan(0);
            expect(pods[0].metadata.labels["group"]).to.be.eqls("hkube");
        }).timeout(1000 * 60 * 10);

        // p2
        it('algorithm labels', async () => {
            const algName = pipelineRandomName(8).toLowerCase();
            const algV1 = algJson(algName, algorithmImageV1);
            algV1.minHotWorkers = 1; // get a pod running
            algV1.labels = { "created-by": "test" };
            await applyAlg(algV1, dev_token);
            await intervalDelay("Waiting", 10000);
            let times = 0;
            let pods = [];
            while (pods.length === 0 && times < 15) {
                await delay(1000);
                pods = await filterPodsByName(algName) || [];
                times++;
            }
            expect(pods.length).to.be.greaterThan(0);
            expect(pods[0].metadata.labels["created-by"]).to.be.eqls("test");
        }).timeout(1000 * 60 * 10);

        //p3
        it('algorithm annotations', async () => {
            // const nodes = await getNodes();
            const algName = pipelineRandomName(8).toLowerCase();
            const algV1 = algJson(algName, algorithmImageV1);
            //  const algV2 = algJson(algName,algorithmImageV2)
            //  algV1.nodeSelector = {"kubernetes.io/hostname": nodes[2] }
            algV1.minHotWorkers = 1; // get a pod running
            algV1.annotations = { "annotations-by": "test" }

            let v1 = await applyAlg(algV1, dev_token);
            let times = 0;
            let pods = [];
            while (pods.length === 0 && times < 15) {
                await delay(1000);
                pods = await filterPodsByName(algName) || [];
                times++;
            }
            expect(pods.length).to.be.greaterThan(0);
            expect(pods[0].metadata.annotations["annotations-by"]).to.be.eqls("test");
        }).timeout(1000 * 60 * 10);

        it('update algorithm nodeSelector', async () => {
            const nodes = await getNodes();
            expect(nodes.length).to.be.above(1, "Received 1 or less nodes.");
            //create and store an algorithm
            const algName = pipelineRandomName(8).toLowerCase();
            selectedNodeAlgName = algName;
            console.log(`Alg name is : ${algName}`);
            const algV1 = algJson(algName, algorithmImageV1);
            algV1.minHotWorkers = 1; // get a pod running
            algV1.nodeSelector = { "kubernetes.io/hostname": nodes[1] };
            let v1 = await applyAlg(algV1, dev_token);
            console.log(`Alg stored, selected node : ${nodes[1]}`);
            let times = 0;
            let pods = [];
            while (pods.length === 0 && times < 15) {
                await delay(1000);
                pods = await filterPodsByName(algName) || [];
                times++;
            }//awaits hotworker uptime
            expect(pods.length).to.be.greaterThan(0);
            const podNames = pods.map((n) => { return n.metadata.name }); // Should hold only one node - the original selection
            console.log(`Pod name after first store action : ${podNames}`);
            const firstPodName = podNames[0]; // Store first pod's name from the pod array
            const podNode = await getPodNode(firstPodName);
            expect(podNode).to.be.equal(nodes[1]); // verify worker on selected node nodes[2]

            algV1.nodeSelector = { "kubernetes.io/hostname": nodes[0] };
            algV1.minHotWorkers = 1;
            console.log(`New Selected node : ${nodes[0]}`);
            //store and update the new algorithm with a new version + a different selected node nodes[1];
            v1 = await applyAlg(algV1, dev_token);
            await updateAlgorithmVersion(algName, v1.body.algorithm.version, dev_token, true);

            times = 0;
            let podsNamesAfter = [];
            while (podsNamesAfter.length === 0 && times < 45) {
                await delay(1000);
                podsNamesAfter = await filterPodsByName(algName) || [];
                podsNamesAfter = podsNamesAfter.filter((n) => {
                    if (n.metadata.name !== firstPodName) { //Make sure the old pod is not returned
                        return n.metadata.name;
                    }
                });
                times++;
            }
            expect(podsNamesAfter.length).to.not.equal(0, "No new pods found with the new alg after store+update");
            console.log(`Pod names after new node selection : ${podsNamesAfter[0].metadata.name}`);
            //var index = podNamesAfter.indexOf(podNames[0]); //index=0; when fails.
            //var filteredAry = ary.filter(e => e !== 'seven')
            const podNodeAfter = await getPodNode(podsNamesAfter[0].metadata.name);
            expect(podNodeAfter).to.be.equal(nodes[0]);
        }).timeout(1000 * 60 * 10);

        it(`change baseImage trigger new Build`, async () => {
            const code1 = path.join(process.cwd(), 'additionalFiles/python.versions.tar.gz');
            const entry = 'main27';
            const algName = `python3.8-test-1-${pipelineRandomName(4).toLowerCase()}`;
            const pythonVersion = "python:3.8";
            const buildStatusAlg = await buildAlgorithmAndWait({ code: code1, algName: algName, entry: entry, kc_token: dev_token, baseVersion: pythonVersion, algorithmArray: algList });
            expect(buildStatusAlg.status).to.be.equal("completed");
            expect(buildStatusAlg.algorithmImage).to.contain(buildStatusAlg.imageTag); //.endsWith(buildStatusAlg.imageTag)
            let alg = await getAlgorithm(algName, dev_token);

            let algJson = JSON.parse(alg.text);
            alg = await getAlgorithm(algName, dev_token);
            algJson.baseImage = "python:3.9";
            let v2 = await storeAlgorithmApply(algJson, dev_token);
            const buildStatus = await (getStatusall(v2.body.buildId, `/builds/status/`, StatusCodes.OK, "completed", dev_token, 1000 * 60 * 15));
            //expect(v2.algorithmImage).to.contain(v2.imageTag)
            expect(v2.imageTag).to.not.be.equal(buildStatusAlg.imageTag);
            expect(v2.body.messages[0].startsWith("a build was triggered due to change in baseImage")).to.be.true;
        }).timeout(1000 * 60 * 20);

        it(`change env trigger new Build`, async () => {
            const code1 = path.join(process.cwd(), 'additionalFiles/python.versions.tar.gz');
            const entry = 'main27';
            const algName = `python3.8-test-1-${pipelineRandomName(4).toLowerCase()}`;
            const pythonVersion = "python:3.8";
            const buildStatusAlg = await buildAlgorithmAndWait({ code: code1, algName: algName, entry: entry, kc_token: dev_token, baseVersion: pythonVersion, algorithmArray: algList });
            expect(buildStatusAlg.status).to.be.equal("completed");
            expect(buildStatusAlg.algorithmImage).to.contain(buildStatusAlg.imageTag); //.endsWith(buildStatusAlg.imageTag)
            let alg = await getAlgorithm(algName, dev_token);

            let algJson = JSON.parse(alg.text);
            alg = await getAlgorithm(algName, dev_token);
            algJson.env = "nodejs";
            let v2 = await storeAlgorithmApply(algJson, dev_token);
            const buildStatus = await (getStatusall(v2.body.buildId, `/builds/status/`, StatusCodes.OK, "completed", dev_token, 1000 * 60 * 15));
            //expect(v2.algorithmImage).to.contain(v2.imageTag)
            expect(v2.imageTag).to.not.be.equal(buildStatusAlg.imageTag);
            expect(v2.body.messages[0].startsWith("a build was triggered due to change in env")).to.be.true;
        }).timeout(1000 * 60 * 20);

        it('Update Algorithm version', async () => {
            await applyAlg(algorithmV1, dev_token);
            const algVersion = await getAlgorithmVersion(algorithmName, dev_token);
            expect(algVersion.body.length).to.be.equal(1);
            let v2 = await storeAlgorithmApply(algorithmV2, dev_token);
            //validate there are two images
            const algVersion2 = await getAlgorithmVersion(algorithmName, dev_token);
            expect(algVersion2.body.length).to.be.equal(2);

            //store pipeline algorithm-version-test
            await storePipeline(d, dev_token);
            const jobId = await runStoredAndWaitForResults(d, dev_token);
            // result should be (v1)        
            const result1 = await getResult(jobId, StatusCodes.OK, dev_token);
            expect(result1.data[0].result.vaerion).to.be.equal("v1");

            const update = await updateAlgorithmVersion(algorithmName, v2.body.algorithm.version, dev_token, true);
            await delay(2000);
            const jobId2 = await runStoredAndWaitForResults(d, dev_token);
            //validate result should be (v2)
            const result2 = await getResult(jobId2, StatusCodes.OK, dev_token);
            expect(result2.data[0].result.vaerion).to.be.equal("v2");

        }).timeout(1000 * 60 * 10);

        it('Delete Algorithm deletes pipeline', async () => {
            await applyAlg(algorithmV1, dev_token);

            //store pipeline algorithm-version-test
            await storePipeline(d, dev_token);
            // const jobId = await runStoredAndWaitForResults(d, dev_token)        
            await storeAlgorithmApply(algorithmV2, dev_token);
            //const update = await updateAlgorithmVersion(algorithmName,algorithmImageV2,true);
            await delay(2000);
            //const jobId2 = await runStoredAndWaitForResults(d, dev_token)      
            await deleteAlgorithm(algorithmName, dev_token, true);
            await delay(2000);
            const pipeline = await getPipeline(d.name, dev_token);
            expect(pipeline.body.error.message).to.include("Not Found");
            const getAlg = await getAlgorithm(algorithmName, dev_token);
            expect(getAlg.body.error.message).to.include("Not Found");
        }).timeout(1000 * 60 * 5);


        it('Delete Algorithm deletes versions', async () => {
            //validate that after delete old algorith, version are deleted.
            await applyAlg(algorithmV1, dev_token);
            await applyAlg(algorithmV2, dev_token);
            await delay(2000);

            await applyAlg(algorithmV1, dev_token);
            const algVersion1 = await getAlgorithmVersion(algorithmName, dev_token);
            expect(algVersion1.body.length).to.be.equal(1);
        }).timeout(1000 * 60 * 5);

        it('Update algorithm version while executing force = true', async () => {
            const pipe = {
                name: d.name,
                flowInput: {
                    inp: 30000
                }
            }
            await applyAlg(algorithmV1, dev_token);
            let v2 = await storeAlgorithmApply(algorithmV2, dev_token);
            await delay(2000);
            await storePipeline(d, dev_token);
            const res = await runStored(pipe, dev_token);
            const jobId = res.body.jobId;
            await intervalDelay("Waiting", 15000, 1500);
            const update = await updateAlgorithmVersion(algorithmName, v2.body.algorithm.version, dev_token, true);
            expect(update.status).to.be.equal(StatusCodes.CREATED);
            await intervalDelay("Waiting", 10000);
            const status = await getPipelineStatus(jobId, dev_token);
            expect(status.body.status).to.be.equal("failed");
            const alg = await getAlgorithm(algorithmName, dev_token);
            expect(alg.body.algorithmImage).to.be.equal(algorithmImageV2);
        }).timeout(1000 * 60 * 5);

        it('Try Update algorithm version while executing force = false', async () => {
            const pipe = {
                name: d.name,
                flowInput: {
                    inp: 30000
                }
            }
            await applyAlg(algorithmV1, dev_token);
            let v2 = await storeAlgorithmApply(algorithmV2, dev_token);
            await delay(2000);
            await storePipeline(d, dev_token);
            const res = await runStored(pipe, dev_token);
            const jobId = res.body.jobId;
            await intervalDelay("Waiting", 10000);
            const update = await updateAlgorithmVersion(algorithmName, v2.body.algorithm.version, dev_token, false);
            expect(update.status).to.be.equal(StatusCodes.BAD_REQUEST);
            await delay(3000);
            const result2 = await getResult(jobId, StatusCodes.OK, dev_token);
            expect(result2.data[0].result.vaerion).to.be.equal("v1");
            const alg = await getAlgorithm(algorithmName, dev_token);
            expect(alg.body.algorithmImage).to.be.equal(algorithmImageV1);
        }).timeout(1000 * 60 * 5);

        it('Delete algorithm current version ', async () => {
            let v1 = await applyAlg(algorithmV1, dev_token);
            let v2 = await storeAlgorithmApply(algorithmV2, dev_token);
            await delay(2000);

            await updateAlgorithmVersion(algorithmName, v2.body.algorithm.version, dev_token, false);
            let deleteAlg = await deleteAlgorithmVersion(algorithmName, v2.body.algorithm.version, dev_token);
            expect(deleteAlg.body.error.message).to.be.equal("unable to remove the currently used version");
            deleteAlg = await deleteAlgorithmVersion(algorithmName, v1.body.algorithm.version, dev_token);
            expect(deleteAlg.status).to.be.equal(StatusCodes.OK);
            const algVersion = await getAlgorithmVersion(algorithmName, dev_token);
            expect(algVersion.body.length).to.be.equal(1);
        }).timeout(1000 * 60 * 5);

        it('check save current version algorithem after update and no delete versions after delete algorithm', async () => {
            await applyAlg(algorithmV1, dev_token);

            const resAlgorithmV1 = await runAlgorithm(
                {
                    "name": algorithmV1.name,
                    "input": [],
                    "debug": false
                },
                dev_token
            );

            await delay(2000);
            await storeAlgorithmApply(algorithmV2, dev_token);

            const { job } = await getJobById(dev_token, resAlgorithmV1.body.jobId);
            const versionranAlgorithm = await getJobsByNameAndVersion(dev_token, job.graph.nodes[0].algorithmName, job.graph.nodes[0].algorithmVersion);
            expect(algorithmV1.algorithmImage).to.be.equal(versionranAlgorithm.algorithmsByVersion.algorithm.algorithmImage);

            await deleteAlgorithm(algorithmName, dev_token, true, true);
            const ranAlgorithmAfterDelete = await getJobsByNameAndVersion(dev_token, job.graph.nodes[0].algorithmName, job.graph.nodes[0].algorithmVersion);
            expect(algorithmV1.algorithmImage).to.be.equal(ranAlgorithmAfterDelete.algorithmsByVersion.algorithm.algorithmImage);
        }).timeout(1000 * 60 * 5);
    });

    describe('Test algorithm reservedMemory', () => {
        //the alg code 
        // def start(args, hkubeapi):
        //     input=args['input'][0]
        //     EnvironmentVariables = os.getenv(input, 'Foo does not exist')
        //     time.sleep(2)
        //     return EnvironmentVariables
        it('validate that  reservedMemory Variables saved as DISCOVERY_MAX_CACHE_SIZE', async () => {
            let alg = {
                name: "env",
                cpu: 1,
                gpu: 0,
                mem: "256Mi",
                reservedMemory: "3Gi",
                minHotWorkers: 0,
                env: "python",
                entryPoint: "envAlg",
                type: "Image",
                options: {
                    "debug": false,
                    "pending": false
                },
                workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 2000 },
                "version": "1.0.0",
                algorithmImage: "docker.io/hkubedevtest/env-alg:vv61f5gc4"
            }

            const pipe = {
                name: "env",

                nodes: [
                    {
                        algorithmName: "env",
                        input: [
                            "DISCOVERY_MAX_CACHE_SIZE"
                        ],
                        nodeName: "env"
                    }
                ],
                options: {
                    "batchTolerance": 100,
                    "concurrentPipelines": {
                        "amount": 10,
                        "rejectOnFailure": true
                    },
                    "progressVerbosityLevel": "info",
                    "ttl": 3600
                },
                priority: 3,
                experimentName: "main",

            }
            alg.reservedMemory = "3Gi";
            await applyAlg(alg, dev_token);
            // const jnk = await applyAlg(alg, dev_token);
            const res = await runRaw(pipe, dev_token);
            const jobId = res.body.jobId;
            const result = await getResult(jobId, StatusCodes.OK, dev_token);
            console.log(result);
            expect(result.data[0].result).to.be.equal("3072");
            alg.name = "env1";
            alg.reservedMemory = "512Mi";
            pipe.nodes[0].algorithmName = "env1";
            await applyAlg(alg, dev_token);
            const res2 = await runRaw(pipe, dev_token);
            const jobId2 = res2.body.jobId;
            const result2 = await getResult(jobId2, StatusCodes.OK, dev_token);
            expect(result2.data[0].result).to.be.equal("512");
            console.log(result2);
        }).timeout(1000 * 10 * 60);
    })

    describe('Test algorithm workerCustomResources', () => {
        it('algorithm with workerCustomResources should run with stated workerCustomValues values', async () => {
            let alg = {
                name: "workercustom",
                cpu: 0.1,
                gpu: 0,
                mem: "256Mi",
                workerCustomResources: {
                    requests: {
                        cpu: "0.1",
                        memory: "128Mi"
                    },
                    limits: {
                        cpu: "0.1",
                        memory: "128Mi"
                    },
                },
                minHotWorkers: 0,
                env: "python",
                entryPoint: "envAlg",
                type: "Image",
                options: {
                    "debug": false,
                    "pending": false
                },
                workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 1000 },
                "version": "1.0.0",
                algorithmImage: "docker.io/hkubedevtest/env-alg:vv61f5gc4"
            }
            let algRun = {
                name: "workercustom",
                input: [
                    "FOO"
                ],
                debug: false
            }
            await applyAlg(alg, dev_token);
            await runAlgorithm(algRun, dev_token);
            await intervalDelay("Waiting", 15000, 1500);
            const expectedPod = await filterPodsByName(alg.name);
            const containerSpec = await getPodSpecByContainer(expectedPod[0].metadata.name);
            expect(normalizeCpuValue(containerSpec.resources.requests.cpu)).to.be.equal(parseFloat(alg.workerCustomResources.requests.cpu));
            expect(containerSpec.resources.requests.memory).to.be.equal(alg.workerCustomResources.requests.memory);
            expect(normalizeCpuValue(containerSpec.resources.limits.cpu)).to.be.equal(parseFloat(alg.workerCustomResources.limits.cpu));
            expect(containerSpec.resources.limits.memory).to.be.equal(alg.workerCustomResources.limits.memory);
        }).timeout(1000 * 10 * 60)

        it('algorithm with workerCustomResources should run with stated workerCustomValues cpu and no memory', async () => {
            let alg = {
                name: "workercustomnomem",
                cpu: 0.1,
                gpu: 0,
                mem: "256Mi",
                workerCustomResources: {
                    requests: {
                        cpu: "0.1",

                    },
                    limits: {
                        cpu: "0.2",

                    },
                },
                minHotWorkers: 0,
                env: "python",
                entryPoint: "envAlg",
                type: "Image",
                options: {
                    "debug": false,
                    "pending": false
                },
                workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 1000 },
                "version": "1.0.0",
                algorithmImage: "docker.io/hkubedevtest/env-alg:vv61f5gc4"
            }
            let algRun = {
                name: "workercustomnomem",
                input: [
                    "FOO"
                ],
                debug: false
            }
            await applyAlg(alg, dev_token);
            await runAlgorithm(algRun, dev_token);
            await intervalDelay("Waiting", 15000, 1500);
            const expectedPod = await filterPodsByName(alg.name);
            const containerSpec = await getPodSpecByContainer(expectedPod[0].metadata.name);
            expect(normalizeCpuValue(containerSpec.resources.requests.cpu)).to.be.equal(parseFloat(alg.workerCustomResources.requests.cpu));
            expect(containerSpec.resources.requests.memory).to.be.undefined;
            // expect(containerSpec.resources.requests.memory).to.be.equal('512Mi');
            expect(normalizeCpuValue(containerSpec.resources.limits.cpu)).to.be.equal(parseFloat(alg.workerCustomResources.limits.cpu));
            expect(containerSpec.resources.limits.memory).to.be.undefined;
            // expect(containerSpec.resources.limits.memory).to.be.equal('1Gi');
        }).timeout(1000 * 10 * 60);
    });

    describe('Test algorithm Environment Variables', () => {
        let alg = {
            name: "ev",
            cpu: 1,
            gpu: 0,
            mem: "256Mi",
            minHotWorkers: 0,

            type: "Image",
            env: "python",
            entryPoint: "envAlg",
            options: {
                binary: true,
                debug: false,
                pending: false
            },
            workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 2000 },
            algorithmImage: "docker.io/hkubedevtest/env-alg:vv61f5gc4",//"docker.io/hkubedevtest/stream-image-sleep-end:v8ie4jvzf",
            algorithmEnv: {
                FOO: "I got foo",
                SECRET: {
                    "secretKeyRef": {
                        "name": "docker-credentials-secret",
                        "key": "docker_push_password"
                    }
                },
                CM: {
                    "configMapKeyRef": {
                        "name": "api-server-configmap",
                        "key": "DEFAULT_STORAGE"
                    }
                },

                REASOURCE: {
                    "resourceFieldRef": {
                        "containerName": "algorunner",
                        "resource": "requests.cpu"
                    }
                }
                ,
                FR: {
                    "fieldRef": {
                        "fieldPath": "spec.nodeName"
                    }

                }

            }

        }

        it('algorithm Environment Variables ', async () => {
            await applyAlg(alg, dev_token);
            const algRun = {
                name: alg.name,
                input: ["FOO"]
            }
            //input:[{"action":"env","EnvironmentVariable":"FOO"}]}

            const res = await runAlgorithm(algRun, dev_token);
            const jobId = res.body.jobId;
            const result = await getResult(jobId, StatusCodes.OK, dev_token);
            expect(result.data[0].result).to.be.equal(alg.algorithmEnv.FOO);
        }).timeout(1000 * 5 * 60);

        it('algorithm Environment Variables secretKeyRef', async () => {
            await applyAlg(alg, dev_token);
            const algRun = {
                name: alg.name,
                //input:[{"action":"env","EnvironmentVariable":"SECRET"}]}
                input: ["SECRET"]
            }

            const res = await runAlgorithm(algRun, dev_token);
            const jobId = res.body.jobId;
            const result = await getResult(jobId, StatusCodes.OK, dev_token);
            expect(result.data[0].result).to.contain("Hkube");
        }).timeout(1000 * 5 * 60);

        it('algorithm Environment Variables configMapKeyRef', async () => {
            await applyAlg(alg, dev_token);
            const algRun = {
                name: alg.name,
                input: ["CM"]
            }
            // input:[{"action":"env","EnvironmentVariable":"CM"}]}

            const res = await runAlgorithm(algRun, dev_token);
            const jobId = res.body.jobId;
            const result = await getResult(jobId, StatusCodes.OK, dev_token);
            expect(result.data[0].result).to.be.equal("fs");
        }).timeout(1000 * 5 * 60);

        it('algorithm Environment Variables resourceFieldRefCE', async () => {
            await applyAlg(alg, dev_token);
            const algRun = {
                name: alg.name,
                input: ["REASOURCE"]
            }
            // input:[{"action":"env","EnvironmentVariable":"REASOURCE"}]}

            const res = await runAlgorithm(algRun, dev_token);
            const jobId = res.body.jobId;
            const result = await getResult(jobId, StatusCodes.OK, dev_token);
            expect(result.data[0].result).to.be.equal("1");
        }).timeout(1000 * 5 * 60);

        it('algorithm Environment Variables fieldRef', async () => {
            await applyAlg(alg, dev_token);

            const algRun = {
                name: alg.name,
                input: ["FR"]
            }
            //input:[{"action":"env","EnvironmentVariable":"FR"}]}

            const res = await runAlgorithm(algRun, dev_token);
            const jobId = res.body.jobId;
            const result = await getResult(jobId, StatusCodes.OK, dev_token);
            expect(result.data[0].result).to.contain("compute.internal");
        }).timeout(1000 * 5 * 60);

        it('algorithm hot workers', async () => {
            let alg = {
                name: "hot-worker-alg",
                cpu: 0.1,
                gpu: 0,
                mem: "32Mi",
                algorithmImage: "tamir321/versatile:04",
                minHotWorkers: 3,
                type: "Image",
                options: {
                    debug: false,
                    pending: false
                },
                workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 2000 }
            }
            await applyAlg(alg, dev_token);
            await intervalDelay("Waiting", 40000);
            const workers = await waitForWorkers(dev_token, alg.name, alg.minHotWorkers);
            await deleteAlgorithm(alg.name, dev_token, true);
            expect(workers.length).to.be.equal(alg.minHotWorkers);
        }).timeout(1000 * 5 * 60);
    });

    describe('algorithm execute another', () => {
        it('TID-600 algorithm execute another algorithm (git 288)', async () => {
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
            await applyAlg(alg, dev_token);
            //need to add alg versatile-pipe
            const algName = "black-alg";
            const pipe = {
                "name": "versatile-pipe",
                "flowInput": {
                    "inp": [{
                        "type": "algorithm",
                        "name": `${algName}`,
                        "input": ["a"]
                    }]
                }
            }
            const d = deconstructTestData(testData4);

            //store pipeline evalwait
            const a = await storePipeline(d, dev_token);

            //run the pipeline evalwait
            const jobId = await runStoredAndWaitForResults(pipe, dev_token);

            const graph = await getRawGraph(jobId, dev_token);
            expect(graph.body.nodes.length).to.be.equal(2);
        }).timeout(1000 * 5 * 60);
    });

    describe('insert algorithm array', () => {
        it('should succeed to store an array of algorithms', async () => {
            let algorithmsList = [
                {
                    name: "alg1",
                    cpu: 0.1,
                    gpu: 0,
                    mem: "256Mi",
                    minHotWorkers: 0,
                    algorithmImage: "docker.io/hkubedevtest/lonstringv3:vq2vozy33",
                    type: "Image",
                    options: {
                        debug: false,
                        pending: false
                    },
                    workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 2000 }
                },
                {
                    name: "alg2",
                    cpu: 0.1,
                    gpu: 0,
                    mem: "256Mi",
                    minHotWorkers: 0,
                    algorithmImage: "docker.io/hkubedevtest/lonstringv3:vq2vozy33",
                    type: "Image",
                    options: {
                        debug: false,
                        pending: false
                    },
                    workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 2000 }
                }
            ];

            const response = await applyAlgList(algorithmsList, dev_token, true);
            const listOfAlgorithmResponse = response.body;
            expect(listOfAlgorithmResponse).to.be.an('array');
            expect(listOfAlgorithmResponse.length).to.be.equal(2);
            expect(response.statusCode).to.be.equal(StatusCodes.CREATED, 'Expected status code to be CREATED');
            expect(listOfAlgorithmResponse[0].algorithm.name).to.be.equal('alg1');
            expect(listOfAlgorithmResponse[1].algorithm.name).to.be.equal('alg2');
        }).timeout(1000 * 60 * 5);

        it('create an algorithm array containing a 409 Conflict status and error message for existing algorithms', async () => {
            let existingAlg = {
                name: "alg1",
                cpu: 0.1,
                gpu: 0,
                mem: "256Mi",
                minHotWorkers: 0,
                algorithmImage: "docker.io/hkubedevtest/lonstringv3:vq2vozy33",
                type: "Image",
                options: {
                    debug: false,
                    pending: false
                },
                workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 2000 }
            }
            await applyAlg(existingAlg, dev_token);

            let algorithmsList = [
                {
                    "name": "alg1",
                    "cpu": 0.1,
                    "gpu": 0,
                    "mem": "256Mi",
                    "minHotWorkers": 0,
                    "algorithmImage": "docker.io/hkubedevtest/lonstringv3:vq2vozy33",
                    "type": "Image",
                    "options": {
                        "debug": false,
                        "pending": false
                    }
                },
                {
                    name: "alg2",
                    cpu: 0.1,
                    gpu: 0,
                    mem: "256Mi",
                    minHotWorkers: 0,
                    algorithmImage: "docker.io/hkubedevtest/lonstringv3:vq2vozy33",
                    type: "Image",
                    options: {
                        debug: false,
                        pending: false
                    },
                    workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 2000 }
                }
            ];
            const response = await applyAlgList(algorithmsList, dev_token);
            const listOfAlgorithmResponse = response.body;
            expect(response.statusCode).to.be.equal(StatusCodes.CREATED);
            expect(listOfAlgorithmResponse).to.be.an('array');
            expect(listOfAlgorithmResponse.length).to.be.equal(2);
            expect(listOfAlgorithmResponse[0].error.code).to.be.equal(409, 'Expected status code to be CONFLICT');
            expect(listOfAlgorithmResponse[1].algorithm.name).to.be.equal('alg2');
        }).timeout(1000 * 60 * 5);

        it('overwrite an algorithm', async () => {
            let existingAlg = {
                name: "alg1",
                cpu: 0.1,
                gpu: 0,
                mem: "256Mi",
                minHotWorkers: 0,
                algorithmImage: "docker.io/hkubedevtest/lonstringv3:vq2vozy33",
                type: "Image",
                options: {
                    debug: false,
                    pending: false
                },
                workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 2000 }
            }
            await applyAlg(existingAlg);

            let algorithmsList = [
                {
                    "name": "alg1",
                    "cpu": 0.1,
                    "gpu": 0,
                    "mem": "256Mi",
                    "minHotWorkers": 0,
                    "algorithmImage": "docker.io/hkubedevtest/lonstringv3:vq2vozy33",
                    "type": "Image",
                    "options": {
                        "debug": false,
                        "pending": false
                    }
                },
                {
                    name: "alg2",
                    cpu: 0.2,
                    gpu: 0,
                    mem: "256Mi",
                    minHotWorkers: 0,
                    algorithmImage: "docker.io/hkubedevtest/lonstringv3:vq2vozy33",
                    type: "Image",
                    options: {
                        debug: false,
                        pending: false
                    },
                    workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 2000 }
                }
            ];
            const response = await applyOrUpdateAlgList(algorithmsList, dev_token);
            const listOfAlgorithmResponse = response.body;
            expect(response.statusCode).to.be.equal(StatusCodes.CREATED);
            expect(listOfAlgorithmResponse).to.be.an('array');
            expect(listOfAlgorithmResponse.length).to.be.equal(2);
            expect(listOfAlgorithmResponse[1].algorithm.name).to.be.equal('alg2');
            const alg2Response = await getAlgorithm('alg2', dev_token);
            expect(alg2Response.body.cpu).to.eq(0.2);

        }).timeout(1000 * 60 * 5);

        it('should succeed creating an array containing a 400 Bad Request status and error message for invalid data', async () => {
            const invalidAlgorithmData = [
                {
                    name: 'Invalid Algorithm NAME-',
                    algorithmImage: 'image',
                    mem: '50Mi',
                    cpu: 1,
                    type: 'Image',
                },
                {
                    name: "alg1",
                    cpu: 0.1,
                    gpu: 0,
                    mem: "256Mi",
                    minHotWorkers: 0,
                    algorithmImage: "docker.io/hkubedevtest/lonstringv3:vq2vozy33",
                    type: "Image",
                    options: {
                        debug: false,
                        pending: false
                    },
                    workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 2000 }
                },
            ];
            const response = await applyAlgList(invalidAlgorithmData, dev_token, true);
            const listOfAlgorithmResponse = response.body;
            expect(listOfAlgorithmResponse).to.be.an('array');
            expect(listOfAlgorithmResponse.length).to.be.equal(2);
            expect(response.statusCode).to.be.equal(StatusCodes.CREATED, 'Expected status code to be CREATED');
            expect(listOfAlgorithmResponse[0].error.code).to.be.equal(StatusCodes.BAD_REQUEST, 'Expected status code to be BAD_REQUEST');
            expect(listOfAlgorithmResponse[1].algorithm.name).to.be.equal('alg1');
        });
    });

    describe('kubernetes algorithm tests', () => {
        const stayupAlgName = `stayuptestalg-${pipelineRandomName(4).toLowerCase()}`;
        const statelessAlgName = `yellow-alg-${pipelineRandomName(4).toLowerCase()}`;
        statelessPipe.descriptor.nodes[0].algorithmName = stayupAlgName;
        let stayUpSkeleton = {
            name: stayupAlgName,
            input: []
        }

        it('should apply selector when given one, and find no pods to stop', async () => {
            const response = await deleteAlgorithmPods("anyName", dev_token, "mySelector");
            expect(response.statusCode).to.be.equal(StatusCodes.NOT_FOUND);
            expect(response.body).to.be.equal('No pods found with selector mySelector');
        }).timeout(1000 * 60 * 5);

        it('should find one pod to delete', async () => {
            let suffix = pipelineRandomName(4).toLowerCase();
            stayUpAlg.name += `-${suffix}`;
            stayUpSkeleton.name = stayUpAlg.name;
            await applyAlg(stayUpAlg, dev_token);
            stayUpAlg.name = stayupAlgName;
            const result = await runAlgorithm(stayUpSkeleton, dev_token);
            await intervalDelay("Waiting for creation", 20000);
            const response = await deleteAlgorithmPods(stayUpSkeleton.name, dev_token);
            await delay(1000);
            await stopPipeline(result.body.jobId, dev_token);
            expect(response.statusCode).to.be.equal(StatusCodes.OK);
            expect(response.body.message.length).to.be.equal(1);
            await deleteAlgorithmJobs(stayUpSkeleton.name, dev_token);
        }).timeout(1000 * 60 * 5);

        it('should find multiple pods to delete', async () => {
            const statelessPipeline = deconstructTestData(statelessPipe);
            await deletePipeline(statelessPipeline.name, dev_token);
            await applyAlg(stayUpAlg, dev_token);
            await storePipeline(statelessPipeline, dev_token);
            await runStored(statelessPipeline, dev_token);
            await intervalDelay("Waiting", 30000);
            const response = await deleteAlgorithmPods("yellow-alg", dev_token);
            expect(response.statusCode).to.be.equal(StatusCodes.OK);
            expect(response.body.message.length).to.be.greaterThan(2);
            await deleteAlgorithmJobs(stayUpSkeleton.name, dev_token);
            await deleteAlgorithmJobs(statelessAlgName, dev_token);
            await deletePipeline(statelessPipeline.name, dev_token)
            await deleteAlgorithm(stayupAlgName, dev_token, true)
        }).timeout(1000 * 60 * 5);

        it('should apply selector when given one, and find no jobs to stop', async () => {
            const response = await deleteAlgorithmJobs("anyName", dev_token, "mySelector");
            expect(response.statusCode).to.be.equal(StatusCodes.NOT_FOUND);
            expect(response.body).to.be.equal('No jobs found with selector mySelector');
        }).timeout(1000 * 60 * 5);

        it('should find one job to delete', async () => {
            let suffix = pipelineRandomName(4).toLowerCase();
            stayUpAlg.name += `-${suffix}`;
            stayUpSkeleton.name = stayUpAlg.name;
            await applyAlg(stayUpAlg, dev_token);
            stayUpAlg.name = stayupAlgName;
            const result = await runAlgorithm(stayUpSkeleton, dev_token);
            await intervalDelay("Waiting for creation", 20000);
            const response = await deleteAlgorithmJobs(stayUpSkeleton.name, dev_token);
            await delay(1000);
            await stopPipeline(result.body.jobId, dev_token);
            expect(response.statusCode).to.be.equal(StatusCodes.OK);
            expect(response.body.message.length).to.be.equal(1);
        }).timeout(1000 * 60 * 5);

        it('should find multiple jobs to delete', async () => {
            const statelessPipeline = deconstructTestData(statelessPipe);
            await deletePipeline(statelessPipeline.name, dev_token);
            await applyAlg(stayUpAlg, dev_token);
            storeResult = await storePipeline(statelessPipeline, dev_token);
            await runStored(statelessPipeline, dev_token);
            await intervalDelay("Waiting", 30000);
            const response = await deleteAlgorithmJobs("yellow-alg", dev_token);
            expect(response.statusCode).to.be.equal(StatusCodes.OK);
            expect(response.body.message.length).to.be.greaterThan(2);
            await deleteAlgorithmJobs(stayUpSkeleton.name, dev_token);
        }).timeout(1000 * 60 * 5);
    });
});
