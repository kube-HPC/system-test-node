const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')
const config = require('../config/config');
require('./processEvent')

const { runAlgorithm,
    deleteAlgorithm,
    getAlgorithm,
    getAlgorithmVersion,
    updateAlgorithmVersion,
    storeAlgorithmApply,
    deleteAlgorithmVersion,
    buildAlgorithmAndWait,
    tagAlgorithmVersion,
    getAlgVersion,
    insertAlgorithms,
    storeAlgorithms,
    storeOrUpdateAlgorithms,
    deleteAlgorithmJobs,
    deleteAlgorithmPods
} = require('../utils/algorithmUtils')

const { filterPodsByName,
    getNodes,
    getPodNode
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
    getParsedGraph
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
    pipelineRandomName } = require('../utils/pipelineUtils')

chai.use(chaiHttp);


const { waitForWorkers, getJobsByNameAndVersion, getJobById } = require('../utils/socketGet')
describe('Alrogithm Tests', () => {


    it("get nodes", async () => {
        console.log("~~~~~~~~~~~~get nodes~~~~~~~~~~~~")
        console.log("K8S_CONFIG_PATH - " + process.env.K8S_CONFIG_PATH)
        console.log("BASE_URL - " + process.env.BASE_URL)
        const nodes = await getNodes();
        console.log("node 0 - " + nodes[0])

    }).timeout(1000 * 60 * 5);
    let algList = [];
    let selectedNodeAlgName = "";

    after(async function () {
        this.timeout(2 * 60 * 1000);
        console.log("algList = " + algList)
        j = 0
        z = 3

        while (j < algList.length) {
            delAlg = algList.slice(j, z)
            const del = delAlg.map((e) => {
                return deleteAlgorithm(e)
            })
            console.log("delAlg-" + delAlg)
            const delResult = await Promise.all(del)
            console.log("delResult-" + delResult)
            await delay(2000)
            j += 3
            z += 3
            console.log("j=" + j + ",z=" + z)
        }


        console.log("end -----")

    })



    describe('TID 480 - Test Algorithm ttl (git 61 342)', () => {



        // p1
        it('ttl = 3 one of the inputs = 5 seconds ', async () => {
            const d = deconstructTestData(testData3)
            await deletePipeline(d)
            await storePipeline(d)
            const jobId = await runStoredAndWaitForResults(d)
            const graph = await getRawGraph(jobId)
            const nodesStatus = graph.body.nodes[0].batch
            const nodesError = nodesStatus.filter(obj => obj.error == "Algorithm TTL expired")
            expect(nodesError.length).to.be.equal(1)

        }).timeout(1000 * 60 * 5);

        it('ttl =0 one of the inputs = 5 seconds', async () => {
            const d = deconstructTestData(testData3)
            await deletePipeline(d)
            d.pipeline.nodes[0].ttl = 0
            await storePipeline(d)
            const jobId = await runStoredAndWaitForResults(d)
            const graph = await getRawGraph(jobId)
            const nodesStatus = graph.body.nodes[0].batch
            const nodesError = nodesStatus.filter(obj => obj.error == "Algorithm TTL expired")
            expect(nodesError.length).to.be.equal(0)
        }).timeout(1000 * 60 * 5);

    })

    describe('Test Algorithm Version (git 560 487 998)', () => {
        //https://app.zenhub.com/workspaces/hkube-5a1550823895aa68ea903c98/issues/kube-hpc/hkube/560
        const algorithmName = "algorithm-version-test"
        const algorithmImageV1 = "tamir321/algoversion:v1"
        const algorithmImageV2 = "tamir321/algoversion:v2"
        const algJson = (algName, imageName) => {
            let alg = {
                name: algName,
                cpu: 0.001,
                gpu: 0,
                mem: "32Mi",
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

        afterEach(async function () {
            if ((this.currentTest.title === "update algorithm nodeSelector") && (this.currentTest.state === 'failed')) {
                console.log(`After ${this.currentTest.title} failure - `)
                if (this.currentTest.timedOut) {
                    console.log(`failed due to test total timeout`);
                }
                try {
                    const discovery = await chai.request(config.apiServerUrl)
                        .get(`/resources/unscheduledalgorithms/${selectedNodeAlgName}`);
                    if (discovery.status === 200) {
                        console.log(`Reason for the unschedualing of alg after node selector : ${discovery.body.message}\n`);
                        const amountMissing = discovery.body.complexResourceDescriptor.nodes[0].amountsMissing;
                        let resourceMissingMessage = '';
                        Object.entries(amountMissing).forEach(([k, v]) => {
                            resourceMissingMessage += `${k} : ${v}, `
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

        const algorithmV1 = algJson(algorithmName, algorithmImageV1)
        const algorithmV2 = algJson(algorithmName, algorithmImageV2)
        const d = deconstructTestData(testData1)
        //store pipeline

        it('algorithm change creates a new version', async () => {
            await deleteAlgorithm(algorithmName, true)
            let v1 = await storeAlgorithmApply(algorithmV1);
            algorithmV1.algorithmEnv = { "FOO": "123456" }
            let v2 = await storeAlgorithmApply(algorithmV1);
            const algVersion2 = await getAlgorithmVersion(algorithmName);
            expect(algVersion2.body.length).to.be.equal(2)
            let alg = await getAlgorithm(algorithmName)
            expect(JSON.parse(alg.text).version).to.be.equal(v1.body.algorithm.version)
            const update = await updateAlgorithmVersion(algorithmName, v2.body.algorithm.version, true);
            alg = await getAlgorithm(algorithmName)
            expect(JSON.parse(alg.text).algorithmEnv.FOO).to.be.equal('123456')

        }).timeout(1000 * 60 * 10);


        it('algorithm version can have tag  ', async () => {

            await deleteAlgorithm(algorithmName, true)
            const v1 = await storeAlgorithmApply(algorithmV1);

            const tag = await tagAlgorithmVersion(algorithmName, v1.body.algorithm.version, "myTag1")
            const v1Tag = await getAlgVersion(algorithmName, v1.body.algorithm.version)
            algorithmV1.cpu = 2
            const v2 = await storeAlgorithmApply(algorithmV1);
            const algVersion2 = await getAlgorithmVersion(algorithmName);
            expect(algVersion2.body.length).to.be.equal(2)
            await tagAlgorithmVersion(algorithmName, v2.body.algorithm.version, "myTag2")
            const v2Tag = await getAlgVersion(algorithmName, v2.body.algorithm.version)

            expect(JSON.parse(v1Tag.text).tags[0]).to.be.equal("myTag1")
            expect(JSON.parse(v2Tag.text).tags[0]).to.be.equal("myTag2")
        }).timeout(1000 * 60 * 10);


        it(' algorithm lablels does not overwrite defaults', async () => {
            const nodes = await getNodes();

            const algName = pipelineRandomName(8).toLowerCase()
            const algV1 = algJson(algName, algorithmImageV1)
            // const algV2 = algJson(algName,algorithmImageV2)
            // algV1.nodeSelector = {"kubernetes.io/hostname": nodes[2] }
            algV1.minHotWorkers = 1; // get a pod running
            algV1.labels = { "group": "test" }

            let v1 = await storeAlgorithmApply(algV1);
            let times = 0;
            let pods = [];
            while (pods.length == 0 && times < 15) {
                await delay(1000);
                pods = await filterPodsByName(algName);
                times++;
            }
            expect(pods[0].metadata.labels["group"]).to.be.eqls("hkube")
            deleteAlgorithm(algName)
        }).timeout(1000 * 60 * 10);


        // p2
        it(' algorithm labels   ', async () => {
            const algName = pipelineRandomName(8).toLowerCase()
            const algV1 = algJson(algName, algorithmImageV1)
            algV1.minHotWorkers = 1; // get a pod running
            algV1.labels = { "created-by": "test" }
            let v1 = await storeAlgorithmApply(algV1);
            await delay(10000)
            let times = 0;
            let pods = [];
            while (pods.length == 0 && times < 15) {
                await delay(1000);
                pods = await filterPodsByName(algName);
                times++;
            }
            expect(pods[0].metadata.labels["created-by"]).to.be.eqls("test")
            deleteAlgorithm(algName)
        }).timeout(1000 * 60 * 10);

        //p3
        it(' algorithm annotations ', async () => {
            // const nodes = await getNodes();

            const algName = pipelineRandomName(8).toLowerCase()
            const algV1 = algJson(algName, algorithmImageV1)
            //  const algV2 = algJson(algName,algorithmImageV2)
            //  algV1.nodeSelector = {"kubernetes.io/hostname": nodes[2] }
            algV1.minHotWorkers = 1; // get a pod running
            algV1.annotations = { "annotations-by": "test" }

            let v1 = await storeAlgorithmApply(algV1);
            let times = 0;
            let pods = [];
            while (pods.length == 0 && times < 15) {
                await delay(1000);
                pods = await filterPodsByName(algName);
                times++;
            }
            expect(pods[0].metadata.annotations["annotations-by"]).to.be.eqls("test")
            deleteAlgorithm(algName)
        }).timeout(1000 * 60 * 10);

        it('update algorithm nodeSelector', async () => {
            const nodes = await getNodes();
            expect(nodes.length).to.be.above(1, "Received 1 or less nodes.");
            //create and store an algorithm
            const algName = pipelineRandomName(8).toLowerCase()
            selectedNodeAlgName = algName;
            console.log(`Alg name is : ${algName}`);
            const algV1 = algJson(algName, algorithmImageV1);
            algV1.minHotWorkers = 1; // get a pod running
            algV1.nodeSelector = { "kubernetes.io/hostname": nodes[1] }
            let v1 = await storeAlgorithmApply(algV1);
            algList.push(algName); // List removes algs in .after
            console.log(`Alg stored, selected node : ${nodes[1]}`);
            let times = 0;
            let pods = [];
            while (pods.length == 0 && times < 15) {
                await delay(1000);
                pods = await filterPodsByName(algName);
                times++;
            }//awaits hotworker uptime
            const podNames = pods.map((n) => { return n.metadata.name }) // Should hold only one node - the original selection
            console.log(`Pod name after first store action : ${podNames}`);
            const firstPodName = podNames[0]; // Store first pod's name from the pod array
            const podNode = await getPodNode(firstPodName);
            expect(podNode).to.be.equal(nodes[1]) // verify worker on selected node nodes[2]

            algV1.nodeSelector = { "kubernetes.io/hostname": nodes[0] }
            algV1.minHotWorkers = 1;
            console.log(`New Selected node : ${nodes[0]}`);
            //store and update the new algorithm with a new version + a different selected node nodes[1];
            v1 = await storeAlgorithmApply(algV1);
            const update = await updateAlgorithmVersion(algName, v1.body.algorithm.version, true);

            times = 0;
            let podsNamesAfter = [];
            while (podsNamesAfter.length == 0 && times < 45) {
                await delay(1000);
                podsNamesAfter = await filterPodsByName(algName);
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
            const podNodeAfter = await getPodNode(podsNamesAfter[0].metadata.name)
            expect(podNodeAfter).to.be.equal(nodes[0])
            deleteAlgorithm(algName)
        }).timeout(1000 * 60 * 10);

        it(`change baseImage trigger new Build`, async () => {
            const code1 = path.join(process.cwd(), 'additionalFiles/python.versions.tar.gz');
            const entry = 'main27'
            const algName = "python2.7-test-1"
            const pythonVersion = "python:2.7"
            await deleteAlgorithm(algName)
            const buildStatusAlg = await buildAlgorithmAndWait({ code: code1, algName: algName, entry: entry, baseVersion: pythonVersion, algorithmArray: algList })
            expect(buildStatusAlg.status).to.be.equal("completed")
            expect(buildStatusAlg.algorithmImage).to.contain(buildStatusAlg.imageTag)//.endsWith(buildStatusAlg.imageTag)
            let alg = await getAlgorithm(algName)

            let algJson = JSON.parse(alg.text);
            alg = await getAlgorithm(algName)
            algJson.baseImage = "python:3.8"
            let v2 = await storeAlgorithmApply(algJson);
            //expect(v2.algorithmImage).to.contain(v2.imageTag)
            expect(v2.imageTag).to.not.be.equal(buildStatusAlg.imageTag)
            expect(v2.body.messages[0].startsWith("a build was triggered due to change in baseImage")).to.be.true
            algList.push(algName); // List removes algs in .after
        }).timeout(1000 * 60 * 20)


        it(`change env trigger new Build`, async () => {
            const code1 = path.join(process.cwd(), 'additionalFiles/python.versions.tar.gz');
            const entry = 'main27'
            const algName = "python2.7-test-1"
            const pythonVersion = "python:2.7"
            await deleteAlgorithm(algName)
            const buildStatusAlg = await buildAlgorithmAndWait({ code: code1, algName: algName, entry: entry, baseVersion: pythonVersion, algorithmArray: algList })
            expect(buildStatusAlg.status).to.be.equal("completed")
            expect(buildStatusAlg.algorithmImage).to.contain(buildStatusAlg.imageTag)//.endsWith(buildStatusAlg.imageTag)
            let alg = await getAlgorithm(algName)

            let algJson = JSON.parse(alg.text);
            alg = await getAlgorithm(algName)
            algJson.env = "nodejs"
            let v2 = await storeAlgorithmApply(algJson);
            //expect(v2.algorithmImage).to.contain(v2.imageTag)
            expect(v2.imageTag).to.not.be.equal(buildStatusAlg.imageTag)
            expect(v2.body.messages[0].startsWith("a build was triggered due to change in env")).to.be.true
        }).timeout(1000 * 60 * 20)

        it('Update  Algorithm version', async () => {
            await deleteAlgorithm(algorithmName, true)
            await storeAlgorithmApply(algorithmV1);
            const algVersion = await getAlgorithmVersion(algorithmName);
            expect(algVersion.body.length).to.be.equal(1)
            let v2 = await storeAlgorithmApply(algorithmV2);
            //validate there are two images
            const algVersion2 = await getAlgorithmVersion(algorithmName);
            expect(algVersion2.body.length).to.be.equal(2)

            //store pipeline algorithm-version-test
            await storePipeline(d)
            const jobId = await runStoredAndWaitForResults(d)
            // result should be (v1)        
            const result1 = await getResult(jobId, 200)
            expect(result1.data[0].result.vaerion).to.be.equal("v1")

            const update = await updateAlgorithmVersion(algorithmName, v2.body.algorithm.version, true);
            await delay(2000)
            const jobId2 = await runStoredAndWaitForResults(d)
            //validate result should be (v2)
            const result2 = await getResult(jobId2, 200)
            expect(result2.data[0].result.vaerion).to.be.equal("v2")

            await deleteAlgorithm(algorithmName, true)
        }).timeout(1000 * 60 * 10);



        it('Delete  Algorithm deletes pipeline', async () => {

            await deleteAlgorithm(algorithmName, true)
            await storeAlgorithmApply(algorithmV1);

            //store pipeline algorithm-version-test
            await storePipeline(d)
            // const jobId = await runStoredAndWaitForResults(d)        
            await storeAlgorithmApply(algorithmV2);
            //const update = await updateAlgorithmVersion(algorithmName,algorithmImageV2,true);
            await delay(2000)
            //const jobId2 = await runStoredAndWaitForResults(d)       
            const alg = await deleteAlgorithm(algorithmName, true)
            await delay(2000)
            const pipeline = await getPipeline(d.name)
            expect(pipeline.body.error.message).to.include("Not Found")
            const getAlg = await getAlgorithm(algorithmName)
            expect(getAlg.body.error.message).to.include("Not Found")

        }).timeout(1000 * 60 * 5);


        it('Delete  Algorithm deletes versions', async () => {
            //validate that after delete old algorith, version are deleted.
            await deleteAlgorithm(algorithmName, true)
            await storeAlgorithmApply(algorithmV1);
            await storeAlgorithmApply(algorithmV2);
            await delay(2000)

            await deleteAlgorithm(algorithmName, true)
            await storeAlgorithmApply(algorithmV1);
            const algVersion1 = await getAlgorithmVersion(algorithmName);
            expect(algVersion1.body.length).to.be.equal(1)
            await deleteAlgorithm(algorithmName, true)

        }).timeout(1000 * 60 * 5);

        it('Update algorithm version while executing force = true', async () => {
            const pipe = {
                name: d.name,
                flowInput: {
                    inp: 30000
                }
            }
            await deleteAlgorithm(algorithmName, true)
            await storeAlgorithmApply(algorithmV1);
            let v2 = await storeAlgorithmApply(algorithmV2);
            await delay(2000)
            await storePipeline(d)
            const res = await runStored(pipe)
            const jobId = res.body.jobId
            await delay(15000)
            const update = await updateAlgorithmVersion(algorithmName, v2.body.algorithm.version, true);
            expect(update.status).to.be.equal(201);
            await delay(5000);
            const status = await getPipelineStatus(jobId)
            expect(status.body.status).to.be.equal("failed")
            const alg = await getAlgorithm(algorithmName)
            expect(alg.body.algorithmImage).to.be.equal(algorithmImageV2)
            await deleteAlgorithm(algorithmName, true)



        }).timeout(1000 * 60 * 5);

        it('Try Update algorithm version while executing force = false', async () => {

            const pipe = {
                name: d.name,
                flowInput: {
                    inp: 30000
                }
            }

            await deleteAlgorithm(algorithmName, true)
            await storeAlgorithmApply(algorithmV1);
            let v2 = await storeAlgorithmApply(algorithmV2);
            await delay(2000)
            await storePipeline(d)
            const res = await runStored(pipe)
            const jobId = res.body.jobId
            await delay(10000)
            const update = await updateAlgorithmVersion(algorithmName, v2.body.algorithm.version, false);
            expect(update.status).to.be.equal(400);
            await delay(3000)
            const result2 = await getResult(jobId, 200)
            expect(result2.data[0].result.vaerion).to.be.equal("v1")
            const alg = await getAlgorithm(algorithmName)
            expect(alg.body.algorithmImage).to.be.equal(algorithmImageV1)
            await deleteAlgorithm(algorithmName, true)



        }).timeout(1000 * 60 * 5);




        it('Delete  algorithm current version ', async () => {


            await deleteAlgorithm(algorithmName, true)
            let v1 = await storeAlgorithmApply(algorithmV1);
            let v2 = await storeAlgorithmApply(algorithmV2);
            await delay(2000)

            const update = await updateAlgorithmVersion(algorithmName, v2.body.algorithm.version, false);
            let deleteAlg = await deleteAlgorithmVersion(algorithmName, v2.body.algorithm.version);
            expect(deleteAlg.body.error.message).to.be.equal("unable to remove used version")
            deleteAlg = await deleteAlgorithmVersion(algorithmName, v1.body.algorithm.version);
            expect(deleteAlg.status).to.be.equal(200)
            const algVersion = await getAlgorithmVersion(algorithmName)
            expect(algVersion.body.length).to.be.equal(1)

            await deleteAlgorithm(algorithmName, true)



        }).timeout(1000 * 60 * 5);

        it('check save current version algorithem after update and no delete versions after delete algorithm', async () => {

            await deleteAlgorithm(algorithmName, true);
            await storeAlgorithmApply(algorithmV1);

            const resAlgorithmV1 = await runAlgorithm(
                {
                    "name": algorithmV1.name,
                    "input": [],
                    "debug": false
                }
            );

            await delay(2000);
            await storeAlgorithmApply(algorithmV2);

            const { job } = await getJobById(resAlgorithmV1.body.jobId);
            const versionranAlgorithm = await getJobsByNameAndVersion(job.graph.nodes[0].algorithmName, job.graph.nodes[0].algorithmVersion);
            expect(algorithmV1.algorithmImage).to.be.equal(versionranAlgorithm.algorithmsByVersion.algorithm.algorithmImage)

            await deleteAlgorithm(algorithmName, true, true)
            const ranAlgorithmAfterDelete = await getJobsByNameAndVersion(job.graph.nodes[0].algorithmName, job.graph.nodes[0].algorithmVersion);
            expect(algorithmV1.algorithmImage).to.be.equal(ranAlgorithmAfterDelete.algorithmsByVersion.algorithm.algorithmImage)

            await storeAlgorithmApply(algorithmV1);
            await deleteAlgorithm(algorithmName, true);
        }).timeout(1000 * 60 * 5);

    })


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
            await deleteAlgorithm(alg.name, true)
            alg.reservedMemory = "3Gi"
            await storeAlgorithmApply(alg);
            // const jnk = await storeAlgorithmApply(alg);
            const res = await runRaw(pipe)
            const jobId = res.body.jobId
            const result = await getResult(jobId, 200)
            console.log(result)
            expect(result.data[0].result).to.be.equal("3072")
            alg.name = "env1"
            alg.reservedMemory = "512Mi"
            pipe.nodes[0].algorithmName = "env1"
            await deleteAlgorithm(alg.name, true)
            await storeAlgorithmApply(alg);
            const res2 = await runRaw(pipe)
            const jobId2 = res2.body.jobId
            const result2 = await getResult(jobId2, 200)
            expect(result2.data[0].result).to.be.equal("512")
            console.log(result2)
        }).timeout(1000 * 10 * 60)

    })

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
        let algCreated = false
        const createAlg = async () => {
            if (!algCreated) {
                await deleteAlgorithm(alg.name, true)
                await storeAlgorithmApply(alg);
                algCreated = true

            }

        }

        it('algorithm Environment Variables ', async () => {
            await createAlg()
            const algRun = {
                name: alg.name,
                input: ["FOO"]
            }
            //input:[{"action":"env","EnvironmentVariable":"FOO"}]}

            const res = await runAlgorithm(algRun)
            const jobId = res.body.jobId
            const result = await getResult(jobId, 200)
            expect(result.data[0].result).to.be.equal(alg.algorithmEnv.FOO)
        }).timeout(1000 * 5 * 60)

        it('algorithm Environment Variables secretKeyRef', async () => {
            await createAlg()
            const algRun = {
                name: alg.name,
                //input:[{"action":"env","EnvironmentVariable":"SECRET"}]}
                input: ["SECRET"]
            }

            const res = await runAlgorithm(algRun)
            const jobId = res.body.jobId
            const result = await getResult(jobId, 200)
            expect(result.data[0].result).to.contain("Hkube")
        }).timeout(1000 * 5 * 60)

        it('algorithm Environment Variables configMapKeyRef', async () => {
            await createAlg()
            const algRun = {
                name: alg.name,
                input: ["CM"]
            }
            // input:[{"action":"env","EnvironmentVariable":"CM"}]}

            const res = await runAlgorithm(algRun)
            const jobId = res.body.jobId
            const result = await getResult(jobId, 200)
            expect(result.data[0].result).to.be.equal("fs")
        }).timeout(1000 * 5 * 60)

        it('algorithm Environment Variables resourceFieldRefCE', async () => {
            await createAlg()
            const algRun = {
                name: alg.name,
                input: ["REASOURCE"]
            }
            // input:[{"action":"env","EnvironmentVariable":"REASOURCE"}]}

            const res = await runAlgorithm(algRun)
            const jobId = res.body.jobId
            const result = await getResult(jobId, 200)
            expect(result.data[0].result).to.be.equal("1")
        }).timeout(1000 * 5 * 60)


        it('algorithm Environment Variables fieldRef', async () => {
            await createAlg()

            const algRun = {
                name: alg.name,
                input: ["FR"]
            }
            //input:[{"action":"env","EnvironmentVariable":"FR"}]}

            const res = await runAlgorithm(algRun)
            const jobId = res.body.jobId
            const result = await getResult(jobId, 200)
            expect(result.data[0].result).to.contain("compute.internal")
        }).timeout(1000 * 5 * 60)



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
            await deleteAlgorithm(alg.name, true);
            await storeAlgorithmApply(alg);
            await delay(40000);
            const workers = await waitForWorkers(alg.name, alg.minHotWorkers);
            await deleteAlgorithm(alg.name, true)
            expect(workers.length).to.be.equal(alg.minHotWorkers)
        }).timeout(1000 * 5 * 60)



        describe('algorithm execute another', () => {
            it
                ('TID-600 algorithm execute another algorithm (git 288)', async () => {
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
                    const aa = await deleteAlgorithm("versatile", true)
                    const bb = await storeAlgorithmApply(alg);
                    //need to add alg versatile-pipe
                    const algName = "black-alg"
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
                    const d = deconstructTestData(testData4)

                    //store pipeline evalwait
                    const a = await storePipeline(d)

                    //run the pipeline evalwait


                    const jobId = await runStoredAndWaitForResults(pipe)

                    const graph = await getRawGraph(jobId)
                    expect(graph.body.nodes.length).to.be.equal(2)

                }).timeout(1000 * 5 * 60)


        })

        describe('insert algorithm array', () => {
            it('should succeed to store an array of algorithms', async () => {
                const deletedAlg1 = await deleteAlgorithm("alg1", true)
                const deletedAlg2 = await deleteAlgorithm("alg2", true)
                let algList = [
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

                const response = await storeAlgorithms(algList);
                const listOfAlgorithmResponse = response.body
                expect(listOfAlgorithmResponse).to.be.an('array');
                expect(listOfAlgorithmResponse.length).to.be.equal(2);
                expect(response.statusCode).to.be.equal(201, 'Expected status code to be CREATED');
                expect(listOfAlgorithmResponse[0].name).to.be.equal('alg1');
                expect(listOfAlgorithmResponse[1].name).to.be.equal('alg2');
            }).timeout(1000 * 60 * 5);

            it('create an algorithm array containing a 409 Conflict status and error message for existing algorithms', async () => {
                const deleteAlg1 = await deleteAlgorithm("alg1", true)
                const deleteAlg2 = await deleteAlgorithm("alg2", true)
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
                const responseOfExists = await storeAlgorithms(existingAlg)

                let algList = [
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
                const response = await storeAlgorithms(algList);
                const listOfAlgorithmResponse = response.body
                expect(response.statusCode).to.be.equal(201);
                expect(listOfAlgorithmResponse).to.be.an('array');
                expect(listOfAlgorithmResponse.length).to.be.equal(2);
                expect(listOfAlgorithmResponse[0].error.code).to.be.equal(409, 'Expected status code to be CONFLICT');
                expect(listOfAlgorithmResponse[1].name).to.be.equal('alg2');
            }).timeout(1000 * 60 * 5);

            it('overwrite an algorithm', async () => {
                const deleteAlg1 = await deleteAlgorithm("alg1", true)
                const deleteAlg2 = await deleteAlgorithm("alg2", true)
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
                const responseOfExists = await storeAlgorithms(existingAlg)

                let algList = [
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
                const response = await storeOrUpdateAlgorithms(algList);
                const listOfAlgorithmResponse = response.body
                expect(response.statusCode).to.be.equal(201);
                expect(listOfAlgorithmResponse).to.be.an('array');
                expect(listOfAlgorithmResponse.length).to.be.equal(2);
                expect(listOfAlgorithmResponse[1].name).to.be.equal('alg2');
                alg2Response = await getAlgorithm('alg2');
                expect(alg2Response.body.cpu).to.eq(0.2);

            }).timeout(1000 * 60 * 5);



            it('should succeed creating an array containing a 400 Bad Request status and error message for invalid data', async () => {
                const deleteAlg1 = await deleteAlgorithm("alg1", true)
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
                const response = await storeAlgorithms(invalidAlgorithmData);
                const listOfAlgorithmResponse = response.body
                expect(listOfAlgorithmResponse).to.be.an('array');
                expect(listOfAlgorithmResponse.length).to.be.equal(2);
                expect(response.statusCode).to.be.equal(201, 'Expected status code to be CREATED');
                expect(listOfAlgorithmResponse[0].error.code).to.be.equal(400, 'Expected status code to be BAD-REQUEST');
                expect(listOfAlgorithmResponse[1].name).to.be.equal('alg1');
            });
        }),
        describe('kubernetes algorithm tests', () => {
            const stayupAlgName = "stayuptestalg";
            const statelessAlgName = "yellow-alg"
            let stayUpSkeleton = {
                name: stayupAlgName,
                input: []
            }
            it('should apply selector when given one, and find no pods to stop', async () => {
                const response = await deleteAlgorithmPods("anyName", "mySelector");
                expect(response.statusCode).to.be.equal(404);
                expect(response.body).to.be.equal('No pods found with selector mySelector');
            }).timeout(1000 * 60 * 5);
            it('should find one pod to delete', async () => {
                await deleteAlgorithm(stayupAlgName, true)
                let suffix = pipelineRandomName(4).toLowerCase();
                stayUpAlg.name += `-${suffix}`;
                stayUpSkeleton.name = stayUpAlg.name;
                let storeResult = await storeAlgorithmApply(stayUpAlg);
                stayUpAlg.name = stayupAlgName;
                algList.push(stayUpSkeleton.name);
                const result = await runAlgorithm(stayUpSkeleton);
                await delay(10000); // wait for creation
                const response = await deleteAlgorithmPods(stayUpSkeleton.name);
                await delay(1000);
                await stopPipeline(result.body.jobId);
                expect(response.statusCode).to.be.equal(200);
                expect(response.body.message.length).to.be.equal(1);
                await deleteAlgorithmJobs(stayUpSkeleton.name);
            }).timeout(1000 * 60 * 5);
            it('should find multiple pods to delete', async () => {
                await deleteAlgorithm(stayupAlgName, true)
                const statelessPipeline = deconstructTestData(statelessPipe);
                await deletePipeline(statelessPipeline.name)
                let storeResult = await storeAlgorithmApply(stayUpAlg);
                algList.push(stayUpSkeleton.name);
                storeResult = await storePipeline(statelessPipeline);
                let runResult = await runStored(statelessPipeline);
                await delay(30000);
                const response = await deleteAlgorithmPods("yellow-alg");
                expect(response.statusCode).to.be.equal(200);
                expect(response.body.message.length).to.be.greaterThan(2);
                await deleteAlgorithmJobs(stayUpSkeleton.name);
                await deleteAlgorithmJobs(statelessAlgName);
            }).timeout(1000 * 60 * 5);
            it('should apply selector when given one, and find no jobs to stop', async () => {
                const response = await deleteAlgorithmJobs("anyName", "mySelector");
                expect(response.statusCode).to.be.equal(404);
                expect(response.body).to.be.equal('No jobs found with selector mySelector');
            }).timeout(1000 * 60 * 5);
            it('should find one job to delete', async () => {
                await deleteAlgorithm(stayupAlgName, true)
                let suffix = pipelineRandomName(4).toLowerCase();
                stayUpAlg.name += `-${suffix}`;
                stayUpSkeleton.name = stayUpAlg.name;
                let storeResult = await storeAlgorithmApply(stayUpAlg);
                stayUpAlg.name = stayupAlgName;
                algList.push(stayUpSkeleton.name);
                const result = await runAlgorithm(stayUpSkeleton);
                await delay(10000); // wait for creation
                const response = await deleteAlgorithmJobs(stayUpSkeleton.name);
                await delay(1000);
                await stopPipeline(result.body.jobId);
                expect(response.statusCode).to.be.equal(200);
                expect(response.body.message.length).to.be.equal(1);
            }).timeout(1000 * 60 * 5);
            it('should find multiple jobs to delete', async () => {
                await deleteAlgorithm(stayupAlgName, true)
                const statelessPipeline = deconstructTestData(statelessPipe);
                await deletePipeline(statelessPipeline.name)
                let storeResult = await storeAlgorithmApply(stayUpAlg);
                algList.push(stayUpSkeleton.name);
                storeResult = await storePipeline(statelessPipeline);
                let runResult = await runStored(statelessPipeline);
                await delay(30000);
                const response = await deleteAlgorithmJobs("yellow-alg");
                expect(response.statusCode).to.be.equal(200);
                expect(response.body.message.length).to.be.greaterThan(2);
                await deleteAlgorithmJobs(stayUpSkeleton.name);       
            }).timeout(1000 * 60 * 5);
            

        })
    })
})
