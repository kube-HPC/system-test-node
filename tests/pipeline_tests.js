const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const path = require("path");
const delay = require("delay");
var diff = require("deep-diff").diff;
const config = require(path.join(process.cwd(), 'config/config'));


const {
  runAlgorithm,
  deleteAlgorithm,
  storeAlgorithm,
  StoreDebugAlgorithm,
  storeAlgorithmApply
} = require("../utils/algorithmUtils");

const { cleanPipeLines } = require("../utils/gc");
const {
  getWebSocketJobs,
  getWebSocketlogs,
  getDriverIdByJobId,
} = require("../utils/socketGet");
const { getStatus } = require("../utils/results")

const {
  testData1,
  testData2,
  testData3,
  testData4,
  testData5,
  testData6,
  testData7,
  testData8,
  testData9,
  testData10,
  testData11,
  testData12,
  testData13,
  ttlPipe,
} = require("../config/index").pipelineTest;

const {
  getJobIdsTree,
  getResult,
  getCronResult,
  getRawGraph,
} = require("../utils/results");

// const KubernetesClient = require('@hkube/kubernetes-client').Client;
const {
  exceRerun,
  loadRunStored,
  getPipelineTriggerTree,
  getExecPipeline,
  runRaw,
  deletePipeline,
  pipelineRandomName,
  getPipelineStatus,
  storePipeline,
  runStored,
  deconstructTestData,
  runStoredAndWaitForResults,
  resumePipeline,
  pausePipeline,
  stopPipeline,
  exceCachPipeline,
  getPipelinestatusByName,
  storePipelinesWithDescriptor,
  storeOrUpdatePipelines
} = require("../utils/pipelineUtils");

chai.use(chaiHttp);

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
      pending: false,
    },
    workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 2000 }
  };
  return alg;
};

const getJobId = (array) => {
  for (i = 0; i < array.length; i++) {
    if (typeof array[i].body.jobId != "undefined") {
      return array[i].body.jobId;
    }
  }
  console.log("fail to get jobId");
  return null;
};

const printJobId = (array) => {
  for (i = 0; i < array.length - 1; i++) {
    if (typeof array[i].body.jobId != "undefined") {
      console.log(array[i].body.jobId);
    }
  }
  console.log("fail to get jobId");
  return null;
};

const timeout = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
describe("pipeline Tests 673", () => {
  before(async function () {
    this.timeout(1000 * 60 * 15);
    let testUserBody ={
        username: config.keycloakDevUser,
        password: config.keycloakDevPass
    }
    const response = await chai.request(config.apiServerUrl)
    .post('/auth/login')
    .send(testUserBody)
    
    if (response.status === 200) {
        console.log('dev login success');
        dev_token = response.body.token;
    }
    else {
        console.log('dev login failed - no keycloak/bad credentials');
    }
});
let dev_token;
  const algList = [];
  const pipeList = [];

  const createAlg = async (algName, token = {}) => {
    await deleteAlgorithm(algName, token, true);
    await storeAlgorithm(algName, token);
    algList.push(algName);
  }

  const applyAlg = async (alg, token = {}) => {
    await deleteAlgorithm(alg.name, token, true);
    await storeAlgorithmApply(alg, token);
    algList.push(alg.name);
  }

  const createDebugAlg = async (algName, token = {}) => {
    await deleteAlgorithm(algName, token, true);
    await StoreDebugAlgorithm(algName, token);
    algList.push(algName);
  }

  beforeEach(function () {
    console.log('\n-----------------------------------------------\n');
  });

  after(async function () {
    this.timeout(2 * 60 * 1000);
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
                console.log("Delete Result Message:", result.text);
            }
        });
        await delay(2000);
        j += 3;
        z += 3;
        console.log("j=" + j + ",z=" + z);
    }

    console.log("-----------------------------------------------");
    console.log("pipeList = " + pipeList);
    j = 0;
    z = 3;

    while (j < pipeList.length) {
        delPipe = pipeList.slice(j, z);
        const del = delPipe.map((e) => {
            return deletePipeline(e, dev_token);
        });
        console.log("delPipe-", JSON.stringify(delPipe, null, 2));
        const delResult = await Promise.all(del);
        delResult.forEach(result => {
            if (result && result.text) {
                console.log("Delete Result Message:", result.text);
            }
        });
        await delay(2000);
        j += 3;
        z += 3;
        console.log("j=" + j + ",z=" + z);
    }
    console.log("----------------------- end -----------------------");
  });

  describe("pipeline includeInResults (git 673)", () => {
    //https://app.zenhub.com/workspaces/hkube-5a1550823895aa68ea903c98/issues/kube-hpc/hkube/673

    it("yellow node includeInResults = true", async () => {
      const testData = testData2;
      const d = deconstructTestData(testData);
      await deletePipeline(d, dev_token);
      await storePipeline(d, dev_token, pipeList);
      const jobId = await runStoredAndWaitForResults(d, dev_token);
      const result = await getResult(jobId, 200, dev_token);
      const yellow = result.data.filter((obj) => obj.nodeName == "yellow");
      expect(yellow.length).to.be.equal(7);
      const black = result.data.filter((obj) => obj.nodeName == "black");
      expect(black.length).to.be.equal(1);
    }).timeout(1000 * 60 * 2);

    it("yellow node includeInResults = false", async () => {
      const testData = testData2;
      const d = deconstructTestData(testData);
      await deletePipeline(d, dev_token);
      d.pipeline.nodes[1].includeInResults = false;
      await storePipeline(d, dev_token, pipeList);
      const jobId = await runStoredAndWaitForResults(d, dev_token);
      const result = await getResult(jobId, 200, dev_token);
      const yellow = result.data.filter((obj) => obj.nodeName == "yellow");
      expect(yellow.length).to.be.equal(0);
      const black = result.data.filter((obj) => obj.nodeName == "black");
      expect(black.length).to.be.equal(1);
    }).timeout(1000 * 60 * 2);
  });

  describe("pipeline Types (git 614)", () => {
    // undefined
    const rawPipe = {
      name: "rawPipe",
      nodes: [
        {
          nodeName: "node1",
          algorithmName: "green-alg",
          input: [1, 2, 3],
        },
        {
          nodeName: "node2",
          algorithmName: "yellow-alg",
          input: ["@node1"],
        },
      ],
    };

    it("type= raw", async () => {
      const res = await runRaw(rawPipe, dev_token);

      // write_log(res.body)
      expect(res).to.have.status(200);

      const jobId = res.body.jobId;
      await delay(3 * 1000);
      await getResult(jobId, 200, dev_token);
      //result.status.should.equal('completed')
      const status = await getExecPipeline(jobId, dev_token);
      expect(status.body.types[0]).to.be.equal("raw");
    }).timeout(1000 * 60 * 2);

    it("type= caching", async () => {
      const res = await runRaw(rawPipe, dev_token);
      // write_log(res.body)
      expect(res).to.have.status(200);
      const jobId = res.body.jobId;
      await delay(3 * 1000);
      await getResult(jobId, 200, dev_token);

      const res2 = await exceCachPipeline(jobId, "node2", dev_token);
      const jobId2 = res2.body.jobId;
      await getResult(jobId2, 200, dev_token);
      const status = await getExecPipeline(jobId2, dev_token);
      expect(status.body.types).includes("raw");
      expect(status.body.types).includes("node");
    }).timeout(1000 * 60 * 2);

    it("type= Triger", async () => {
      const testData = testData2;

      const simpleName = testData.descriptor.name;
      const simple = deconstructTestData(testData);
      await deletePipeline(simple, dev_token);
      await storePipeline(simple, dev_token, pipeList);
      const triggeredPipe = pipelineRandomName(8);
      testData.descriptor.name = triggeredPipe;
      testData.descriptor.triggers.pipelines = [simpleName];
      testData.descriptor.nodes[0].input[0] = "jnk";
      const d = deconstructTestData(testData);
      await deletePipeline(d, dev_token);
      const y = await storePipeline(d, dev_token, pipeList);
      await runStoredAndWaitForResults(simple, dev_token);
      await delay(3 * 1000);
      await deletePipeline(d, dev_token);
      jobs = await getWebSocketJobs(dev_token);
      const jobWithTriggers = jobs.filter((obj) => obj.pipeline.triggers);
      const jobId = jobWithTriggers.filter((obj) => obj.pipeline.name === triggeredName)[0].key;
      const status = await getExecPipeline(jobId, dev_token);
      expect(status.body.types).includes("trigger");
      expect(status.body.types).includes("stored");
      expect(status.body.types).includes("internal");
    }).timeout(1000 * 60 * 7);

    it("type= Sub-pipeline", async () => {
      const pipelineName = pipelineRandomName(8);
      const testData = testData6;
      const versatilePipe = testData4;
      const pipe = {
        name: "versatile-pipe",
        flowInput: {
          inp: [
            {
              type: "storedPipeline",
              name: `${pipelineName}`,
              input: ["a"],
            },
          ],
        },
      };
      await createAlg("versatile", dev_token);
      testData.descriptor.name = pipelineName;
      const d = deconstructTestData(testData);
      await deletePipeline(d, dev_token);
      await storePipeline(d, dev_token, pipeList);
      // testData4 = versatile-pipe
      const e = deconstructTestData(versatilePipe);
      await deletePipeline(e, dev_token);
      await storePipeline(e, dev_token,  pipeList);
      await runStoredAndWaitForResults(pipe, dev_token);
      const res = await getPipelinestatusByName(pipelineName, dev_token);
      const status = await getExecPipeline(res.body[0].jobId, dev_token);
      expect(status.body.types).includes("stored");
      expect(status.body.types).includes("sub-pipeline");
      expect(status.body.types).includes("internal");
    }).timeout(1000 * 60 * 30);

    it("type= stored", async () => {
      const pipe = {
        name: "simple",
        flowInput: {
          files: {
            link: "link1",
          },
        },
        priority: 4,
      };
      const res = await runStored(pipe, dev_token);

      // write_log(res.body)
      expect(res).to.have.status(200);

      const jobId = res.body.jobId;
      await delay(3 * 1000);
      await getResult(jobId, 200, dev_token);
      //result.status.should.equal('completed')
      const status = await getExecPipeline(jobId, dev_token);
      expect(status.body.types[0]).to.be.equal("stored");
    }).timeout(1000 * 60 * 2);

    it("type = algorithm ", async () => {
      const alg = { name: "green-alg", input: [1] };
      const res = await runAlgorithm(alg, dev_token);
      const jobId = res.body.jobId;
      await getResult(jobId, 200, dev_token);
      const status = await getExecPipeline(jobId, dev_token);
      expect(status.body.types[0]).to.be.equal("algorithm");
    }).timeout(1000 * 60 * 2);

    xit("type = raw tensor (git 652)", async () => {
      const algorithmName = "tensor1";
      const tensorAlgPath = "docker.io/hkubedevtest/tensor11:v1.0.0"; //"docker.io/hkubedev/tensor1:v1.0.1"
      const tensorAlg = algJson(algorithmName, tensorAlgPath);
      tensorAlg.mem = "5Gi";
      await applyAlg(tensorAlg, dev_token);
      const tensorRawPipe = {
        name: "tesorPipe",
        nodes: [
          {
            nodeName: "node1",
            algorithmName: "tensor1",
            input: [],
            metrics: {
              tensorboard: true,
            },
          },
        ],
      };

      const res = await runRaw(tensorRawPipe, dev_token);

      // write_log(res.body)
      expect(res).to.have.status(200);

      const jobId = res.body.jobId;
      await delay(3 * 1000);
      await getResult(jobId, 200, dev_token);
      //result.status.should.equal('completed')
      const status = await getExecPipeline(jobId, dev_token);
      expect(status.body.types[1]).to.be.equal("tensorboard");
      expect(status.body.types[0]).to.be.equal("raw");
    }).timeout(1000 * 60 * 10);

    it("type = cron  internal ", async () => {
      const testData = testData3;
      testData.descriptor.name = pipelineRandomName(8);
      const d = deconstructTestData(testData);
      await deletePipeline(d, dev_token);
      await storePipeline(d, dev_token, pipeList);
      await delay(1000 * 90);

      const result = await getCronResult(d.name, 5, dev_token);
      const jobId = result.body[0].jobId;
      const status = await getExecPipeline(jobId, dev_token);

      const types = status.body.types;
      const expected = ["cron", "internal", "stored"];
      const a = expected.filter((v) => types.includes(v));
      expect(a.length).to.be.equal(3);
    }).timeout(1000 * 60 * 7);

    it("pipe in pipe", async () => {
      const pipe_in_pipe = {
        name: "pipe_in_pipe",
        nodes: [
          {
            nodeName: "A",
            input: ["7"],
            kind: "pipeline",
            spec: {
              name: "simple",
            },
          },
          {
            nodeName: "B",
            input: ["@A"],
            kind: "pipeline",
            spec: {
              name: "simple",
            },
          },
        ],
        flowInput: {
          range: 50,
          inputs: 4000,
        },
      };

      const res = await runRaw(pipe_in_pipe, dev_token);
      await getResult(res.body.jobId, 200, dev_token);
      const graph = await getRawGraph(res.body.jobId, dev_token);
      expect(graph.body.nodes.length).to.be.equal(6);
    }).timeout(1000 * 60 * 7);

    it.skip("type = Debug ", async () => {
      const algName = pipelineRandomName(8).toLowerCase();

      await createDebugAlg(algName, dev_token);
      const alg = { name: algName, input: [1] };
      const res = await runAlgorithm(alg, dev_token);
      const jobId = res.body.jobId;
      const status = await getExecPipeline(jobId, dev_token);
      expect(status.body.types[1]).to.be.equal("debug");
    }).timeout(1000 * 60 * 7);

    it("re run pipeline", async () => {
      const pipe = {
        name: "simple",
        flowInput: {
          files: {
            link: "inputSimple",
          },
        },
      };
      const res = await runStoredAndWaitForResults(pipe, dev_token);
      const reRun = await exceRerun(res, dev_token);
      const rePipe = await getExecPipeline(reRun.body.jobId, dev_token);
      expect(rePipe.body.flowInput.files.link).to.be.equal(
        pipe.flowInput.files.link
      );
    }).timeout(1000 * 60 * 7);
  });

  describe("pipeline Defaults (git 754)", () => {
    //https://app.zenhub.com/workspaces/hkube-5a1550823895aa68ea903c98/issues/kube-hpc/hkube/754
    const validateDefault = (orgPipeline, pipelineData) => {
      let compare = ["options", "priority"];
      let out = [];
      for (x in compare) {
        const a = diff(orgPipeline[compare[x]], pipelineData[compare[x]]);
        if (a != undefined) {
          out.push(orgPipeline[compare[x]]);
        }
      }
      return out;
    };

    it("TID-450 type = Triger (git 157)", async () => {
      //undefined
      const testData = testData2;
      const triggered = testData7;
      const simpleName = testData.descriptor.name;
      const simple = deconstructTestData(testData);
      await deletePipeline(simple, dev_token);
      await storePipeline(simple, dev_token, pipeList);
      const triggeredPipe = pipelineRandomName(8);
      triggered.descriptor.name = triggeredPipe;
      triggered.descriptor.triggers.pipelines = [simpleName];

      const d = deconstructTestData(triggered);
      await deletePipeline(d, dev_token);
      await storePipeline(d, dev_token, pipeList);
      await runStoredAndWaitForResults(simple, dev_token);
      await delay(3 * 1000);
      jobs = await getWebSocketJobs(dev_token);
      const jobWithTriggers = jobs.filter((obj) => obj.pipeline.triggers);
      const jobId = jobWithTriggers.filter((obj) => obj.pipeline.name === triggeredName)[0].key;
      const pipelineData = await getExecPipeline(jobId, dev_token);
      const rr = validateDefault(triggered.descriptor, pipelineData.body);
      console.log(rr.length > 0 ? "Differences:" + rr : "No differnces.");
      expect(rr.length).to.be.equal(0);
    }).timeout(1000 * 60 * 7);

    it("type Sub-pipeline", async () => {
      const pipelineName = pipelineRandomName(8);
      const testData = testData7;
      const versatilePipe = testData4;
      const pipe = {
        name: "versatile-pipe",
        flowInput: {
          inp: [
            {
              type: "storedPipeline",
              name: `${pipelineName}`,
              input: ["a"],
            },
          ],
        },
      };
      await createAlg("versatile", dev_token);
      testData.descriptor.name = pipelineName;
      const d = deconstructTestData(testData);
      await deletePipeline(d, dev_token);
      await storePipeline(d, dev_token, pipeList);
      // testData4 = versatile-pipe
      const e = deconstructTestData(versatilePipe);
      await deletePipeline(e, dev_token);
      await storePipeline(e, dev_token,  pipeList);
      await runStoredAndWaitForResults(pipe, dev_token);
      const res = await getPipelinestatusByName(pipelineName, dev_token);
      const pipelineData = await getExecPipeline(res.body[0].jobId, dev_token);

      const rr = validateDefault(testData.descriptor, pipelineData.body);
      console.log("there are diffrance in :" + rr);
      expect(rr.length).to.be.equal(0);
    }).timeout(1000 * 60 * 7);

    it("type = cron ", async () => {
      const testData = testData7;
      testData.descriptor.name = pipelineRandomName(8);
      testData.descriptor.triggers.cron.enabled = true;
      const d = deconstructTestData(testData);
      await deletePipeline(d, dev_token);
      await storePipeline(d, dev_token, pipeList);
      await delay(1000 * 90);

      const result = await getCronResult(d.name, 5, dev_token, "main");
      const jobId = result.body[0].jobId;
      const pipelineData = await getExecPipeline(jobId, dev_token);
      const rr = validateDefault(testData.descriptor, pipelineData.body);
      console.log("there are diffrance in :" + rr);
      expect(rr.length).to.be.equal(0);
    }).timeout(1000 * 60 * 7);
  });

  describe("validate flowInput exist (git 725 756)", () => {
    //https://app.zenhub.com/workspaces/hkube-5a1550823895aa68ea903c98/issues/kube-hpc/hkube/725
    //https://app.zenhub.com/workspaces/hkube-5a1550823895aa68ea903c98/issues/kube-hpc/hkube/756

    it("stored does not have flowInput", async () => {
      const simpletestData = testData2;
      const storedsimpleName = pipelineRandomName(8);
      console.log("stored does not have flowInput =" + storedsimpleName);
      simpletestData.descriptor.name = storedsimpleName;
      simpletestData.descriptor.nodes[0].input[0] = "#@flowInput.inp";
      const pipe = {
        name: storedsimpleName,
        flowInput: {
          inp1: [3],
        },
      };
      const simpleStored = deconstructTestData(simpletestData);

      await deletePipeline(simpleStored, dev_token);
      await storePipeline(simpleStored, dev_token, pipeList);
      const res = await runStored(pipe, dev_token);

      expect(res.text).to.include("unable to find flowInput.inp");
    }).timeout(1000 * 60 * 2);

    it("raw does not have flowInput", async () => {
      const pipe = {
        name: "jnk",

        nodes: [
          {
            nodeName: "one",
            algorithmName: "eval-alg",
            input: ["@flowInput.inp"],
          },
          {
            nodeName: "two",
            algorithmName: "eval-alg",
            input: ["@flowInput.two"],
          },
        ],
        flowInput: { inp: 0 },

        options: {
          batchTolerance: 100,
          concurrentPipelines: {
            amount: 10,
            rejectOnFailure: true,
          },
          progressVerbosityLevel: "info",
          ttl: 3600,
        },
        priority: 3,
      };
      const res = await runRaw(pipe, dev_token);

      expect(res.text).to.include("unable to find flowInput.two");
    }).timeout(1000 * 60 * 2);
  
    //undefined
    it("cron  does not have flowInput ", async () => {
      const testData = testData3;
      const pipelineName = pipelineRandomName(8);
      testData.descriptor.name = pipelineName;
      testData.descriptor.nodes[0].input[0] = "@flowInput.inputs";
      const d = deconstructTestData(testData);
      await deletePipeline(d, dev_token);
      await storePipeline(d, dev_token, pipeList);
      await delay(1000 * 120);

      const me = `pipeline ${pipelineName} failed sending to api server, error: unable to find flowInput.inputs`;
      const log = await getWebSocketlogs(dev_token);
      const error = log.filter((obj) => obj.message == me);
      expect(error.length).to.be.greaterThan(0);
    }).timeout(1000 * 60 * 7);

    //undefined
    it("Trigger does not have flowInput", async () => {
      const simpleTestdata = testData2;
      const triggerTestData = testData2;
      const simpleName = simpleTestdata.descriptor.name;
      const simple = deconstructTestData(simpleTestdata);
      await deletePipeline(simple, dev_token);
      await storePipeline(simple, dev_token, pipeList);
      const triggerdName = pipelineRandomName(8);
      triggerTestData.descriptor.name = triggerdName;
      triggerTestData.descriptor.triggers.pipelines = [simpleName];
      const d = deconstructTestData(triggerTestData);
      await deletePipeline(d, dev_token);
      await storePipeline(d, dev_token, pipeList);
      await runStoredAndWaitForResults(simple, dev_token);
      await delay(1000 * 20);
      const log = await getWebSocketlogs(dev_token);
      const me = `pipeline ${triggerdName} failed sending to api server, error: unable to find flowInput.inp`;
      const error = log.filter((obj) => obj.message == me);
      expect(error.length).to.be.greaterThan(0);
    }).timeout(1000 * 60 * 7);

    //undefined
    it("Trigger get input from parent", async () => {
      const triggerTestData = testData9;
      const triggeredName = pipelineRandomName(8);
      triggerTestData.descriptor.name = triggeredName;
      const triggered = deconstructTestData(triggerTestData);
      const trigger = deconstructTestData(testData8);
      await deletePipeline(trigger, dev_token);
      await storePipeline(trigger, dev_token, pipeList);

      await deletePipeline(triggered, dev_token);
      await storePipeline(triggered, dev_token, pipeList);
      await runStoredAndWaitForResults(trigger, dev_token);
      await delay(1000 * 20);
      jobs = await getWebSocketJobs(dev_token);
      const jobWithTriggers = jobs.filter((obj) => obj.pipeline.triggers);
      const jobId = jobWithTriggers.filter((obj) => obj.pipeline.name === triggeredName)[0].key;
      const result = await getResult(jobId, 200, dev_token);
      expect(result.data.length).to.be.equal(10);
      const expected = [46, 47, 48, 49, 50, 51, 52, 53, 54, 45];
      const a = result.data.filter((obj) => !expected.includes(obj.result));
      expect(a.length).to.be.equal(0);
    }).timeout(1000 * 60 * 7);

    it("Sub-pipeline does not have flowInput", async () => {
      // testData2 pipeline Simple2 with flowInput
      // testData4 = versatile-pipe
      const simple2TestData = testData2;
      const versatileTestData = testData4;
      const logBefore = await getWebSocketlogs(dev_token);
      const before = logBefore
        .filter((obj) => typeof obj.message == "string")
        .filter((obj) =>
          obj.message.includes(
            "SubPipeline job error: unable to find flowInput.inp, alg subPipelineId"
          )
        ).length;

      const pipelineName = pipelineRandomName(8);

      const pipe = {
        name: "versatile-pipe",
        flowInput: {
          inp: [
            {
              type: "storedPipeline",
              name: `${pipelineName}`,
              input: ["a"],
            },
          ],
        },
      };
      await createAlg("versatile", dev_token);
      simple2TestData.descriptor.name = pipelineName;
      const d = deconstructTestData(simple2TestData);
      await deletePipeline(d, dev_token);
      await storePipeline(d, dev_token, pipeList);

      const e = deconstructTestData(versatileTestData);
      await deletePipeline(e, dev_token);
      await storePipeline(e, dev_token,  pipeList);
      const res = await runStored(pipe, dev_token);
      await delay(1000 * 20);
      await getDriverIdByJobId(dev_token, res.body.jobId);
      const log = await getWebSocketlogs(dev_token);
      const after = log
        .filter((obj) => typeof obj.message == "string")
        .filter((obj) =>
          obj.message.includes(
            "SubPipeline job error: unable to find flowInput.inp, alg subPipelineId"
          )
        ).length;
      expect(after).to.be.greaterThan(before);
    }).timeout(1000 * 60 * 7);

    it("should run in flow input size and print it values", async () => {
      const { pipeline, input, algorithm } = testData13;
      const printAndReturnAlg = algJson(algorithm.name, algorithm.image);
      printAndReturnAlg["env"] = "python";
      printAndReturnAlg["entryPoint"] = "print-and-return.py";
      await applyAlg(printAndReturnAlg, dev_token);
      await deletePipeline(pipeline["name"], dev_token);
      await storePipeline(pipeline, dev_token, pipeList);
      const jobId = await runStoredAndWaitForResults(pipeline, dev_token);
      const result = await getResult(jobId, 200, dev_token);
      expect(result.data).to.have.lengthOf(8);
      result.data.forEach(output => {
        expect(Object.keys(output.result)).to.have.lengthOf(2);
        expect(output.result.list).to.eql(input.listValues);
        expect(output.result.flow).to.eql(output.batchIndex); // equal to batch index since flow is 1-4, same as index in this case
      });
    }).timeout(1000 * 60 * 2);
  });

  describe("pause_resume_pipelines (git 529 344)", () => {
    //https://app.zenhub.com/workspaces/hkube-5a1550823895aa68ea903c98/issues/kube-hpc/hkube/529
    const algorithmName = "algorithm-version-test";
    const algorithmImageV1 = "tamir321/algoversion:v1";

    const algorithmV1 = algJson(algorithmName, algorithmImageV1);

    const d = deconstructTestData(testData1);

    it("pause resume pipeline singe batch", async () => {
      const pipe = {
        name: d.name,
        flowInput: {
          inp: 15000,
        },
      };
      await applyAlg(algorithmV1);

      await delay(2000);
      await deletePipeline(d, dev_token);
      await storePipeline(d, dev_token, pipeList);
      const res = await runStored(pipe, dev_token);
      const jobId = res.body.jobId;
      await delay(3000);

      await pausePipeline(jobId, dev_token);
      await delay(3000);
      let pipelineStatus = await getPipelineStatus(jobId, dev_token);
      expect(pipelineStatus.body.status).to.be.equal("paused");
      await resumePipeline(jobId, dev_token);
      await getResult(jobId, 200, dev_token);
    }).timeout(1000 * 60 * 5);

    it("pause resume pipeline multiple batch", async () => {
      const e = deconstructTestData(testData5);
      await deletePipeline(e, dev_token);
      await storePipeline(e, dev_token,  pipeList);

      const res = await runStored(e, dev_token);
      const jobId = res.body.jobId;
      await delay(3000);

      await pausePipeline(jobId, dev_token);
      await delay(60000);
      let pipelineStatus = await getPipelineStatus(jobId, dev_token);
      expect(pipelineStatus.body.status).to.be.equal("paused");
      await resumePipeline(jobId, dev_token);
      await getResult(jobId, 200, dev_token);
    }).timeout(1000 * 60 * 20);

    it("pause stop pipeline", async () => {
      const pipe = {
        name: d.name,
        flowInput: {
          inp: 15000,
        },
      };
      await applyAlg(algorithmV1);

      await delay(2000);
      await deletePipeline(d, dev_token);
      await storePipeline(d, dev_token, pipeList);
      const res = await runStored(pipe, dev_token);
      const jobId = res.body.jobId;
      await delay(3000);

      await pausePipeline(jobId, dev_token);
      await delay(3000);
      await getPipelineStatus(jobId, dev_token);

      await stopPipeline(jobId, dev_token);
      const result = await getPipelineStatus(jobId, dev_token);
      expect(result.body.status).to.be.equal("stopped");
    }).timeout(1000 * 60 * 5);

    it("delete pipeline stop all pipeline", async () => {
      function timeout(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }

      const d = deconstructTestData(testData11);
      const priority3 = "pipe-priority3";

      d.pipeline.name = d.name = priority3;
      d.pipeline.priority = 3;

      let pipe3JobId = [];

      function getJobId(array) {
        for (i = 0; i < array.length; i++) {
          if (typeof array[i].body.jobId != "undefined") {
            return array[i].body.jobId;
            break;
          }
        }
        console.log("fail to get jobId");
        return null;
      }

      const pipe3 = {
        name: priority3,
        flowInput: {
          range: 20,
          inputs: 25000,
        },
      };
      await deletePipeline(d, dev_token);
      await storePipeline(d, dev_token, pipeList);

      for (i = 0; i < 20; i++) {
        var parents = await Promise.all([
          runStored(pipe3, dev_token),
          runStored(pipe3, dev_token),
          runStored(pipe3, dev_token),
          runStored(pipe3, dev_token),
          timeout(900),
        ]);
        pipe3JobId.push(parents);
      }

      const first = await getPipelineStatus(getJobId(pipe3JobId[0]), dev_token);
      const last = await getPipelineStatus(getJobId(pipe3JobId[19]), dev_token);

      await deletePipeline(d, dev_token);

      const firstAfter = await getPipelineStatus(getJobId(pipe3JobId[0]), dev_token);
      const lastAfter = await getPipelineStatus(getJobId(pipe3JobId[19]), dev_token);

      expect(first.body.status).to.be.equal("active");
      expect(last.body.status).to.be.equal("pending");
      expect(firstAfter.body.status).to.be.equal("stopped");
      expect(lastAfter.body.status).to.be.equal("stopped");
    }).timeout(1000 * 60 * 25);

    describe("pipeline options", async () => {
      const d = deconstructTestData(ttlPipe);

      it("pipeline ttl", async () => {
        await deletePipeline(d, dev_token);
        await storePipeline(d, dev_token, pipeList);
        const ttl = {
          name: d.name,
          flowInput: {
            inputs: [50000],
          },
          options: {
            ttl: 5,
            activeTtl: 130,
          },
        };
        const runStoredResult = await runStored(ttl, dev_token); //should be stoped  due to ttl
        let getStatusResultBody = await getStatus(runStoredResult.body.jobId, 200, "active", dev_token);
        await timeout(10500);
        await cleanPipeLines(dev_token);
        getStatusResultBody = await getStatus(runStoredResult.body.jobId, 200, "stopped", dev_token);
        expect(getStatusResultBody.reason).to.be.equal("pipeline expired");
      }).timeout(1000 * 60 * 5);

      it("pipeline active ttl", async () => {
        const algorithmName = "algo-not-image";

        await deletePipeline(d, dev_token);

        const testAlgPath = "docker.io/hkubedevtest/test";
        const testAlg = algJson(algorithmName, testAlgPath);
        await applyAlg(testAlg, dev_token);
        await delay(2000);

        d.nodes = [
          {
            "kind": "algorithm",
            "nodeName": "node1",
            "algorithmName": "algo-not-image",

          }
        ]

        await deletePipeline(d, dev_token);
        await storePipeline(d, dev_token, pipeList);

        const ttl = {
          name: d.name,
          flowInput: {
            inputs: [50000],
          },
          options: {
            ttl: 40,
            activeTtl: 5,
          },
        };

        const runStoredResult = await runStored(ttl, dev_token);
        let getStatusResultBody = await getStatus(runStoredResult.body.jobId, 200, "active", dev_token);
        await timeout(5500)
        await cleanPipeLines(dev_token);
        getStatusResultBody = await getStatus(runStoredResult.body.jobId, 200, "stopped", dev_token);
        expect(getStatusResultBody.reason).to.be.equal(
          "pipeline active TTL expired"
        );
      }).timeout(1000 * 60 * 5);

      it("concurrentPipelines - pending  pipeline", async () => {
        //set test data to testData1
        const d = deconstructTestData(testData12);
        await deletePipeline(d.name, dev_token);
        d.pipeline.options = {
          concurrentPipelines: {
            amount: 1,
            rejectOnFailure: false,
          },
        };
        //store pipeline evalwait
        await storePipeline(d, dev_token, pipeList);
        //run the pipeline evalwait  twice the second time will be pending till the first exection completed
        await runStored(d, dev_token);

        const res = await runStored(d, dev_token);
        const jobId = res.body.jobId;
        const currentStatus = await getPipelineStatus(jobId, dev_token);

        expect(currentStatus.body.status).to.have.equal("pending");

      }).timeout(1000 * 60 * 5);

      it("concurrentPipelines - continue to complete pending pipeline", async () => {
        //run the pipeline evalwait  20 times validate that all the 20 executed

        //set test data to testData1
        const d = deconstructTestData(testData12);
        await deletePipeline(d.name, dev_token);
        d.pipeline.options = {
          concurrentPipelines: {
            amount: 4,
            rejectOnFailure: false,
          },
        };
        //store pipeline evalwait
        await storePipeline(d, dev_token, pipeList);
        let pipe3JobId = "";
        for (i = 0; i < 5; i++) {
          var parents = await Promise.all([
            runStored(d, dev_token),
            runStored(d, dev_token),
            runStored(d, dev_token),
            runStored(d, dev_token),
            timeout(900),
          ]);
          pipe3JobId = parents;
        }

        const result2 = await getResult(getJobId(pipe3JobId), 200, dev_token);

        expect(result2.status).to.be.equal("completed");
      }).timeout(1000 * 60 * 5);
    });
  });

  describe("Trigger pipeline ", () => {
    it("Trigger tree", async () => {
      const testData = testData2;

      const simpleName = testData.descriptor.name.toString();
      const simple = deconstructTestData(testData);
      await deletePipeline(simple, dev_token);
      await storePipeline(simple, dev_token, pipeList);
      const triggeredPipe = pipelineRandomName(8);
      const triggeredPipe2 = pipelineRandomName(8);
      testData.descriptor.name = triggeredPipe;
      testData.descriptor.triggers.pipelines = [simpleName];
      testData.descriptor.nodes[0].input[0] = "[1,2]";
      const d = deconstructTestData(testData);
      await deletePipeline(d, dev_token);
      await storePipeline(d, dev_token, pipeList);

      testData.descriptor.name = triggeredPipe2;
      testData.descriptor.triggers.pipelines = [triggeredPipe];
      testData.descriptor.nodes[0].input[0] = "[1,2]";
      const e = deconstructTestData(testData);
      await deletePipeline(e, dev_token);
      await storePipeline(e, dev_token,  pipeList);
      const tree = await getPipelineTriggerTree(simpleName, dev_token);

      expect(tree.text).to.include(triggeredPipe);
      expect(tree.text).to.include(triggeredPipe2);
    }).timeout(1000 * 60 * 7);

    it("Trigger get result tree", async () => {
      const testData = testData2;

      const simpleName = testData.descriptor.name;
      const simple = deconstructTestData(testData);
      await deletePipeline(simple, dev_token);
      await storePipeline(simple, dev_token, pipeList);
      const triggeredPipe = pipelineRandomName(8);
      const triggeredPipe2 = pipelineRandomName(8);
      testData.descriptor.name = triggeredPipe;
      testData.descriptor.triggers.pipelines = [simpleName];
      testData.descriptor.nodes[0].input[0] = "[1,2]";
      const d = deconstructTestData(testData);
      await deletePipeline(d, dev_token);
      await storePipeline(d, dev_token, pipeList);

      testData.descriptor.name = triggeredPipe2;
      testData.descriptor.triggers.pipelines = [triggeredPipe];
      testData.descriptor.nodes[0].input[0] = "[1,2]";
      const e = deconstructTestData(testData);
      await deletePipeline(e, dev_token);
      await storePipeline(e, dev_token,  pipeList);
      //getJobIdsTree
      const jobId = await runStoredAndWaitForResults(simple, dev_token);

      const tree = await getJobIdsTree(jobId, dev_token);
      const firstChildJobId = tree.body.children.filter(
        (a) => a.name == triggeredPipe
      )[0].jobId;
      await getResult(firstChildJobId, 200, dev_token);
      const tree1 = await getJobIdsTree(jobId, dev_token);
      const secondChild = tree1.body.children
        .filter((a) => a.name == triggeredPipe)
        .filter((a) => (a.name = triggeredPipe2));
      expect(secondChild.length).to.be.equal(1);
    }).timeout(1000 * 60 * 7);

    it("Trigger cycle pipeline tree", async () => {
      const testData = testData2;
      const triggeredPipe = pipelineRandomName(8);
      const triggeredPipe2 = pipelineRandomName(8);
      testData.descriptor.triggers.pipelines = [triggeredPipe2];
      const simpleName = testData.descriptor.name;
      const simple = deconstructTestData(testData);
      await deletePipeline(simple, dev_token);
      await storePipeline(simple, dev_token, pipeList);

      testData.descriptor.name = triggeredPipe;
      testData.descriptor.triggers.pipelines = [simpleName];
      testData.descriptor.nodes[0].input[0] = "[1,2]";
      const d = deconstructTestData(testData);
      await deletePipeline(d, dev_token);
      await storePipeline(d, dev_token, pipeList);

      testData.descriptor.name = triggeredPipe2;
      testData.descriptor.triggers.pipelines = [triggeredPipe];
      testData.descriptor.nodes[0].input[0] = "[1,2]";
      const e = deconstructTestData(testData);
      await deletePipeline(e, dev_token);
      await storePipeline(e, dev_token,  pipeList);

      const tree = await getPipelineTriggerTree("", dev_token);
      expect(tree.status).to.be.equal(400);
      expect(tree.body.error.message).to.be.equal(
        "the pipelines triggers is cyclic"
      );
    }).timeout(1000 * 60 * 7);
  });

  describe("TID-440 Pipeline priority tests (git 58)~", () => {
    it("pipeline queue priority test", async () => {
      var characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+=~";
      var charactersLength = characters.length;
      var result = "";
      for (var i = 0; i < 250000; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
      }

      const d = deconstructTestData(testData11);
      const priority3 = "pipe-priority3";
      const priority1 = "pipe-priority1";
      d.pipeline.name = d.name = priority3;
      d.pipeline.priority = 3;
      let pipe1JobId = "";
      let pipe3JobId = "";
      const pipe1 = {
        name: priority1,
        flowInput: {
          range: 20,
          inputs: 5000,
          jnk: result,
        },
      };

      const pipe3 = {
        name: priority3,
        flowInput: {
          range: 20,
          inputs: 5000,
          jnk: result,
        },
      };
      await deletePipeline(d, dev_token);
      const a = await storePipeline(d, dev_token, pipeList);

      d.pipeline.name = d.name = priority1;
      d.pipeline.priority = 1;
      await deletePipeline(d, dev_token);
      const ab = await storePipeline(d, dev_token, pipeList);

      for (i = 0; i < 4; i++) {
        var parents = await Promise.all([
          runStored(pipe3, dev_token),
          runStored(pipe3, dev_token),
          runStored(pipe3, dev_token),
          runStored(pipe3, dev_token),
          timeout(900),
        ]);
        printJobId(parents);
        pipe3JobId = parents;
      }

      for (i = 0; i < 4; i++) {
        var parents = await Promise.all([
          runStored(pipe1, dev_token),
          runStored(pipe1, dev_token),
          runStored(pipe1, dev_token),
          runStored(pipe1, dev_token),
          timeout(900),
        ]);
        pipe1JobId = parents;
      }
      //timeout!!
      const result1 = await getResult(getJobId(pipe1JobId), 200, dev_token);
      const result2 = await getResult(getJobId(pipe3JobId), 200, dev_token);
      expect(result1.timeTook).to.be.lessThan(result2.timeTook);
    }).timeout(1000 * 60 * 35);

    it.skip("fast load ", async () => {
      const load = {
        //name: "pipe-priority3",
        name: "pipe-priority12", //"load",
        flowInput: {
          range: 4,
          inputs: 30000, //,
          // jnk:result
        },
      };

      for (i = 0; i < 500; i++) {
        loadRunStored(load, dev_token);
      }
    });

    it.skip("load test ", async () => {
      const pipe3 = {
        //name: "pipe-priority3",
        name: "load",
        flowInput: {
          range: 20,
          inputs: 10000, //,
          // jnk:result
        },
      };
      for (min = 0; min < 1; min++) {
        const pipesForSec = 100;
        const delay = 1000 / pipesForSec;
        console.log("start - loop");
        for (i = 0; i < 50; i++) {
          for (z = 0; z < pipesForSec; z++) {
            loadrunStored(pipe3, dev_token);
            //await timeout(delay)
          }
          let date_ob = new Date();
          console.log(i + " " + date_ob.getSeconds());
        }

        const pipesForSecBurst = 20;
        const delayBurst = 1000 / pipesForSecBurst;
        console.log("start buresr loop ");
        for (i = 0; i < 10; i++) {
          for (z = 0; z < pipesForSec; z++) {
            loadrunStored(pipe3, dev_token);
            await timeout(delayBurst);
          }
          let date_ob = new Date();
          console.log(i + " " + date_ob.getSeconds());
        }
        console.log("end - minute-" + min);
      }
    }).timeout(1000 * 60 * 25);

    it("Different priority same Pipeline ", async () => {
      const d = deconstructTestData(testData11);
      const pipe = {
        name: d.name,
        flowInput: {
          range: 250,
          inputs: 2000,
        },
        priority: 3,
      };
      await deletePipeline(d, dev_token);
      await storePipeline(d, dev_token, pipeList);
      const res2 = await runStored(pipe, dev_token);
      await delay(2000);
      pipe.priority = 1;
      const res1 = await runStored(pipe, dev_token);
      // write_log(res.body)
      const jobId1 = res1.body.jobId;
      const jobId2 = res2.body.jobId;

      const result1 = await getResult(jobId1, 200, dev_token);
      const result2 = await getResult(jobId2, 200, dev_token);
      expect(result1.timeTook).to.be.lessThan(result2.timeTook);
    }).timeout(1000 * 60 * 2);

    it("Different priority Pipelines with Different algorithm", async () => {
      const testDataA = testData11;
      const d = deconstructTestData(testData11);
      await deletePipeline(d, dev_token);
      await storePipeline(d, dev_token, pipeList);
      const pipe = {
        name: d.name,
        flowInput: {
          range: 500,
          inputs: 6000,
        },
        priority: 3,
      };
      testData11.descriptor.name = testData11.descriptor.name + "2";
      const d2 = deconstructTestData(testDataA);
      await deletePipeline(d2, dev_token);
      await storePipeline(d2, dev_token, pipeList);
      const res2 = await runStored(pipe, dev_token);
      await delay(5000);
      pipe.name = d2.name;
      pipe.priority = 1;
      const res1 = await runStored(pipe, dev_token);
      const jobId1 = res1.body.jobId;
      const jobId2 = res2.body.jobId;

      const result1 = await getResult(jobId1, 200, dev_token, 1000 * 60 * 19);
      const result2 = await getResult(jobId2, 200, dev_token, 1000 * 60 * 19);
      expect(result1.timeTook).to.be.lessThan(result2.timeTook);
    }).timeout(1000 * 60 * 20);

    it("Same priority pipelines different batch sizes ", async () => {
      const d = deconstructTestData(testData10);
      const pipe = {
        name: d.name,
        flowInput: {
          range: 500,
          inputs: 1000,
        },
        priority: 3,
      };
      await deletePipeline(d, dev_token);
      await storePipeline(d, dev_token, pipeList);
      const res2 = await runStored(pipe, dev_token);
      await delay(1000);
      pipe.flowInput.range = 100;
      const res1 = await runStored(pipe, dev_token);
      const jobId1 = res1.body.jobId;
      const jobId2 = res2.body.jobId;

      const result1 = await getResult(jobId1, 200, dev_token, 1000 * 60 * 19);
      const result2 = await getResult(jobId2, 200, dev_token, 1000 * 60 * 19);
      expect(result1.timeTook).to.be.lessThan(result2.timeTook);
    }).timeout(1000 * 60 * 20);
  });

  describe('insert pipeline array', () => {
    it('should succeed to store an array of pipelines', async () => {
      const p = deconstructTestData(testData11);
      const d = deconstructTestData(testData10);
      await deletePipeline(d.name, dev_token);
      await deletePipeline(p.name, dev_token);
      let pipelineList = [
        {
          name: d.name,
          nodes: d.pipeline.nodes
        },
        {
          name: p.name,
          nodes: d.pipeline.nodes
        }
      ];
      const response = await storePipelinesWithDescriptor(pipelineList, dev_token, pipeList);
      const listOfPipelineResponse = response.body
      expect(listOfPipelineResponse).to.be.an('array');
      expect(listOfPipelineResponse.length).to.be.equal(2);
      expect(response.statusCode).to.be.equal(201, 'Expected status code to be CREATED');
      expect(listOfPipelineResponse[0].name).to.be.equal(d.name);
      expect(listOfPipelineResponse[1].name).to.be.equal(p.name);
    }).timeout(1000 * 60 * 5);

    it('should succeed creating an array containing a 409 Conflict status & 200 Created', async () => {
      const p = deconstructTestData(testData11);
      const d = deconstructTestData(testData10);
      await deletePipeline(d.name, dev_token);
      await deletePipeline(p.name, dev_token);
      await storePipeline(p, dev_token, pipeList)
      let pipelineList = [
        {
          name: d.name,
          nodes: d.pipeline.nodes
        },
        {
          name: p.name,
          nodes: d.pipeline.nodes
        }
      ];
      const response = await storePipelinesWithDescriptor(pipelineList, dev_token, pipeList);
      const listOfPipelineResponse = response.body
      expect(listOfPipelineResponse).to.be.an('array');
      expect(listOfPipelineResponse.length).to.be.equal(2);
      expect(response.statusCode).to.be.equal(201, 'Expected status code to be CREATED');
      expect(listOfPipelineResponse[0].name).to.be.equal(d.name);
      expect(listOfPipelineResponse[1].error.code).to.be.equal(409, 'Expected status code to be CONFLICT');
    }).timeout(1000 * 60 * 5);

    it('should succeed insertting pipelines due to overwrite=true flag', async () => {
      const p = deconstructTestData(testData11);
      const d = deconstructTestData(testData10);
      await deletePipeline(d.name, dev_token);
      await deletePipeline(p.name, dev_token);
      p.pipeline.nodes[1].nodeName = "not-overwritten";
      await storePipeline(p, dev_token, pipeList)
      let pipelineList = [
        {
          name: d.name,
          nodes: d.pipeline.nodes
        },
        {
          name: p.name,
          nodes: d.pipeline.nodes
        }
      ];
      const response = await storeOrUpdatePipelines(pipelineList, dev_token, pipeList);
      const listOfPipelineResponse = response.body
      expect(listOfPipelineResponse).to.be.an('array');
      expect(listOfPipelineResponse.length).to.be.equal(2);
      expect(response.statusCode).to.be.equal(201, 'Expected status code to be CREATED');
      expect(listOfPipelineResponse[0].name).to.be.equal(d.name);
      expect(listOfPipelineResponse[1].name).to.be.equal(p.name);
      expect(listOfPipelineResponse[1].nodes[1].nodeName).to.be.equal(listOfPipelineResponse[0].nodes[1].nodeName);
    }).timeout(1000 * 60 * 5);

    it('should succeed creating an array containing a pipeline with a 404 algorithm Not Found status', async () => {
      const d = deconstructTestData(testData10);
      await deletePipeline(d.name, dev_token);
      await deletePipeline("jnk", dev_token);
      let pipelineList = [
        {
          name: d.name,
          nodes: d.pipeline.nodes
        },
        {
          name: "jnk",
          nodes: [
            {
              nodeName: "one",
              algorithmName: "not-existing-alg-w341",
              input: ["@flowInput.inp"],
            },
            {
              nodeName: "two",
              algorithmName: "eval-alg",
              input: ["@flowInput.two"],
            },
          ],
          flowInput: { inp: 0 }
        }
      ];
      const response = await storePipelinesWithDescriptor(pipelineList, dev_token, pipeList);
      const listOfPipelineResponse = response.body
      expect(listOfPipelineResponse).to.be.an('array');
      expect(listOfPipelineResponse.length).to.be.equal(2);
      expect(response.statusCode).to.be.equal(201, 'Expected status code to be CREATED');
      expect(listOfPipelineResponse[0].name).to.be.equal(d.name);
      expect(listOfPipelineResponse[1].error.code).to.be.equal(404, 'Expected status code to be NOT FOUND');
    }).timeout(1000 * 60 * 5);
  });
});
