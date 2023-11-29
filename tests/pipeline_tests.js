const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const path = require("path");
const delay = require("delay");
var diff = require("deep-diff").diff;

const {
  runAlgorithm,
  deleteAlgorithm,
  storeAlgorithm,
  StoreDebugAlgorithm,
  getAlgorithm,
  getAlgorithmVersion,
  updateAlgorithmVersion,
  storeAlgorithmApply,
  deleteAlgorithmVersion,
  getAlgorithim,
} = require("../utils/algorithmUtils");

const { celeanPipeLines } = require("../utils/gc");
const {
  getWebSocketJobs,
  getWebSocketlogs,
  getDriverIdByJobId,
} = require("../utils/socketGet");

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
  };
  return alg;
};

const getJobId = (array) => {
  for (i = 0; i < array.length; i++) {
    if (typeof array[i].body.jobId != "undefined") {
      return array[i].body.jobId;
      break;
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
  describe("pipeline includeInResults (git 673)", () => {
    //https://app.zenhub.com/workspaces/hkube-5a1550823895aa68ea903c98/issues/kube-hpc/hkube/673
    it("yellow node includeInResults = true", async () => {
      const testData = testData2;
      const d = deconstructTestData(testData);
      await deletePipeline(d);
      await storePipeline(d);
      const jobId = await runStoredAndWaitForResults(d);
      const result = await getResult(jobId, 200);
      const yellow = result.data.filter((obj) => obj.nodeName == "yellow");
      expect(yellow.length).to.be.equal(7);
      const black = result.data.filter((obj) => obj.nodeName == "black");
      expect(black.length).to.be.equal(1);
    }).timeout(1000 * 60 * 2);

    it("yellow node includeInResults = false", async () => {
      const testData = testData2;
      const d = deconstructTestData(testData);
      await deletePipeline(d);
      d.pipeline.nodes[1].includeInResults = false;
      await storePipeline(d);
      const jobId = await runStoredAndWaitForResults(d);
      const result = await getResult(jobId, 200);
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
      const res = await runRaw(rawPipe);

      // write_log(res.body)
      expect(res).to.have.status(200);

      const jobId = res.body.jobId;
      await delay(3 * 1000);
      await getResult(jobId, 200);
      //result.status.should.equal('completed')
      const status = await getExecPipeline(jobId);
      expect(status.body.types[0]).to.be.equal("raw");
    }).timeout(1000 * 60 * 2);

    it("type= caching", async () => {
      const res = await runRaw(rawPipe);
      // write_log(res.body)
      expect(res).to.have.status(200);
      const jobId = res.body.jobId;
      await delay(3 * 1000);
      await getResult(jobId, 200);

      const res2 = await exceCachPipeline(jobId, "node2");
      const jobId2 = res2.body.jobId;
      await getResult(jobId2, 200);
      const status = await getExecPipeline(jobId2);
      expect(status.body.types).includes("raw");
      expect(status.body.types).includes("node");
    }).timeout(1000 * 60 * 2);

    it("type= Triger", async () => {
      const testData = testData2;

      const simpleName = testData.descriptor.name;
      const simple = deconstructTestData(testData);
      await deletePipeline(simple);
      await storePipeline(simple);
      const triggeredPipe = pipelineRandomName(8);
      testData.descriptor.name = triggeredPipe;
      testData.descriptor.triggers.pipelines = [simpleName];
      testData.descriptor.nodes[0].input[0] = "jnk";
      const d = deconstructTestData(testData);
      await deletePipeline(d);
      const y = await storePipeline(d);
      await runStoredAndWaitForResults(simple);
      await delay(3 * 1000);
      await deletePipeline(d);
      jobs = await getWebSocketJobs();
      jobId = jobs.filter((obj) => obj.pipeline.triggers)[0].key;
      const status = await getExecPipeline(jobId);
      expect(status.body.types).includes("trigger");
      expect(status.body.types).includes("stored");
      expect(status.body.types).includes("internal");
      await deletePipeline(d);
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
      await storeAlgorithm("versatile");
      testData.descriptor.name = pipelineName;
      const d = deconstructTestData(testData);
      await storePipeline(d);
      // testData4 = versatile-pipe
      const e = deconstructTestData(versatilePipe);
      await storePipeline(e);
      await runStoredAndWaitForResults(pipe);
      const res = await getPipelinestatusByName(pipelineName);
      const status = await getExecPipeline(res.body[0].jobId);
      expect(status.body.types).includes("stored");
      expect(status.body.types).includes("sub-pipeline");
      expect(status.body.types).includes("internal");
      await deletePipeline(d);
    }).timeout(1000 * 60 * 15);

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
      const res = await runStored(pipe);

      // write_log(res.body)
      expect(res).to.have.status(200);

      const jobId = res.body.jobId;
      await delay(3 * 1000);
      await getResult(jobId, 200);
      //result.status.should.equal('completed')
      const status = await getExecPipeline(jobId);
      expect(status.body.types[0]).to.be.equal("stored");
    }).timeout(1000 * 60 * 2);

    it("type = algorithm ", async () => {
      const alg = { name: "green-alg", input: [1] };
      const res = await runAlgorithm(alg);
      const jobId = res.body.jobId;
      await getResult(jobId, 200);
      const status = await getExecPipeline(jobId);
      expect(status.body.types[0]).to.be.equal("algorithm");
    }).timeout(1000 * 60 * 2);

    it("type = raw tensor (git 652)", async () => {
      const algorithmName = "tensor1";
      const tensorAlgPath = "docker.io/hkubedevtest/tensor11:v1.0.0"; //"docker.io/hkubedev/tensor1:v1.0.1"
      const tensorAlg = algJson(algorithmName, tensorAlgPath);
      tensorAlg.mem = "5Gi";
      await storeAlgorithmApply(tensorAlg);
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

      const res = await runRaw(tensorRawPipe);

      // write_log(res.body)
      expect(res).to.have.status(200);

      const jobId = res.body.jobId;
      await delay(3 * 1000);
      await getResult(jobId, 200);
      //result.status.should.equal('completed')
      const status = await getExecPipeline(jobId);
      expect(status.body.types[1]).to.be.equal("tensorboard");
      expect(status.body.types[0]).to.be.equal("raw");
    }).timeout(1000 * 60 * 10);

    it("type = cron  internal ", async () => {
      const testData = testData3;
      testData.descriptor.name = pipelineRandomName(8);
      const d = deconstructTestData(testData);
      await storePipeline(d);
      await delay(1000 * 90);

      const result = await getCronResult(d.name, 5);
      const jobId = result.body[0].jobId;
      const status = await getExecPipeline(jobId);
      await deletePipeline(d);

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

      const res = await runRaw(pipe_in_pipe);
      const result = await getResult(res.body.jobId, 200);
      const graph = await getRawGraph(res.body.jobId);
      expect(graph.body.nodes.length).to.be.equal(6);
    }).timeout(1000 * 60 * 7);

    it.skip("type = Debug ", async () => {
      const algName = pipelineRandomName(8).toLowerCase();

      const debugAlg = await StoreDebugAlgorithm(algName);
      const alg = { name: algName, input: [1] };
      const res = await runAlgorithm(alg);
      const jobId = res.body.jobId;
      const status = await getExecPipeline(jobId);
      await deleteAlgorithm(algName, true);
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
      const res = await runStoredAndWaitForResults(pipe);
      const reRun = await exceRerun(res);
      const rePipe = await getExecPipeline(reRun.body.jobId);
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
      const triggerd = testData7;
      const simpleName = testData.descriptor.name;
      const simple = deconstructTestData(testData);
      await deletePipeline(simple);
      await storePipeline(simple);
      const triggeredPipe = pipelineRandomName(8);
      triggerd.descriptor.name = triggeredPipe;
      triggerd.descriptor.triggers.pipelines = [simpleName];

      const d = deconstructTestData(triggerd);
      await deletePipeline(d);
      await storePipeline(d);
      await runStoredAndWaitForResults(simple);
      await delay(3 * 1000);
      jobs = await getWebSocketJobs();
      jobId = jobs.filter((obj) => obj.pipeline.triggers)[0].key;
      const pipelineData = await getExecPipeline(jobId);
      await deletePipeline(d);
      const rr = validateDefault(triggerd.descriptor, pipelineData.body);
      console.log("there are diffrance in :" + rr);
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
      await storeAlgorithm("versatile");
      testData.descriptor.name = pipelineName;
      const d = deconstructTestData(testData);
      await storePipeline(d);
      // testData4 = versatile-pipe
      const e = deconstructTestData(versatilePipe);
      await storePipeline(e);
      await runStoredAndWaitForResults(pipe);
      const res = await getPipelinestatusByName(pipelineName);
      const pipelineData = await getExecPipeline(res.body[0].jobId);

      await deletePipeline(d);
      const rr = validateDefault(testData.descriptor, pipelineData.body);
      console.log("there are diffrance in :" + rr);
      expect(rr.length).to.be.equal(0);
    }).timeout(1000 * 60 * 7);

    it("type = cron ", async () => {
      const testData = testData7;
      testData.descriptor.name = pipelineRandomName(8);
      testData.descriptor.triggers.cron.enabled = true;
      const d = deconstructTestData(testData);
      await storePipeline(d);
      await delay(1000 * 90);

      const result = await getCronResult(d.name, 5, "main");
      const jobId = result.body[0].jobId;
      const pipelineData = await getExecPipeline(jobId);
      await deletePipeline(d);
      const rr = validateDefault(testData.descriptor, pipelineData.body);
      console.log("there are diffrance in :" + rr);
      expect(rr.length).to.be.equal(0);
    }).timeout(1000 * 60 * 7);
  });
  describe("validate flowInput exist (git 725 756)", () => {
    //https://app.zenhub.com/workspaces/hkube-5a1550823895aa68ea903c98/issues/kube-hpc/hkube/725
    //https://app.zenhub.com/workspaces/hkube-5a1550823895aa68ea903c98/issues/kube-hpc/hkube/756

    it(" stored does not have flowInput", async () => {
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

      await storePipeline(simpleStored);
      const res = await runStored(pipe);

      expect(res.text).to.include("unable to find flowInput.inp");
    }).timeout(1000 * 60 * 2);

    it(" raw does not have flowInput", async () => {
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
      const res = await runRaw(pipe);

      expect(res.text).to.include("unable to find flowInput.two");
    }).timeout(1000 * 60 * 2);
    //undefined
    it(" cron  does not have flowInput ", async () => {
      const testData = testData3;
      const pipelineName = pipelineRandomName(8);
      testData.descriptor.name = pipelineName;
      testData.descriptor.nodes[0].input[0] = "@flowInput.inputs";
      const d = deconstructTestData(testData);
      await storePipeline(d);
      await delay(1000 * 120);

      const me = `pipeline ${pipelineName} failed sending to api server, error: unable to find flowInput.inputs`;
      const log = await getWebSocketlogs();
      const error = log.filter((obj) => obj.message == me);
      await deletePipeline(d);
      expect(error.length).to.be.greaterThan(0);
    }).timeout(1000 * 60 * 7);
    //undefined
    it(" Trigger does not have flowInput", async () => {
      const simpleTestdata = testData2;
      const triggerTestData = testData2;
      const simpleName = simpleTestdata.descriptor.name;
      const simple = deconstructTestData(simpleTestdata);
      await deletePipeline(simple);
      await storePipeline(simple);
      const triggerdName = pipelineRandomName(8);
      triggerTestData.descriptor.name = triggerdName;
      triggerTestData.descriptor.triggers.pipelines = [simpleName];
      const d = deconstructTestData(triggerTestData);
      await deletePipeline(d);
      await storePipeline(d);
      await runStoredAndWaitForResults(simple);
      await delay(1000 * 20);
      const log = await getWebSocketlogs();
      const me = `pipeline ${triggerdName} failed sending to api server, error: unable to find flowInput.inp`;
      const error = log.filter((obj) => obj.message == me);
      await deletePipeline(d);
      expect(error.length).to.be.greaterThan(0);
    }).timeout(1000 * 60 * 7);
    //undefined
    it(" Trigger get input from parent ", async () => {
      const triggerTestData = testData9;
      const triggerdName = pipelineRandomName(8);
      triggerTestData.descriptor.name = triggerdName;
      const triggered = deconstructTestData(triggerTestData);
      const trigger = deconstructTestData(testData8);
      await deletePipeline(trigger);
      await storePipeline(trigger);

      await deletePipeline(triggered);
      await storePipeline(triggered);
      await runStoredAndWaitForResults(trigger);
      await delay(1000 * 20);
      jobs = await getWebSocketJobs();
      jobId = jobs.filter((obj) => obj.pipeline.triggers)[0].key;
      const result = await getResult(jobId, 200);
      await deletePipeline(triggered);
      expect(result.data.length).to.be.equal(10);
      const expected = [46, 47, 48, 49, 50, 51, 52, 53, 54, 45];
      const a = result.data.filter((obj) => !expected.includes(obj.result));
      expect(a.length).to.be.equal(0);
    }).timeout(1000 * 60 * 7);

    it(" Sub-pipeline does not have flowInput", async () => {
      // testData2 pipeline Simple2 with flowInput
      // testData4 = versatile-pipe
      const simple2TestData = testData2;
      const versatileTestData = testData4;
      const logBefore = await getWebSocketlogs();
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
      await storeAlgorithm("versatile");
      simple2TestData.descriptor.name = pipelineName;
      const d = deconstructTestData(simple2TestData);
      await storePipeline(d);

      const e = deconstructTestData(versatileTestData);
      await storePipeline(e);
      const res = await runStored(pipe);
      await delay(1000 * 20);
      const dr = await getDriverIdByJobId(res.body.jobId);
      const log = await getWebSocketlogs();
      const after = log
        .filter((obj) => typeof obj.message == "string")
        .filter((obj) =>
          obj.message.includes(
            "SubPipeline job error: unable to find flowInput.inp, alg subPipelineId"
          )
        ).length;
      await deletePipeline(d);
      expect(after).to.be.greaterThan(before);
    }).timeout(1000 * 60 * 7);
  });
  describe("pause_resume_pipelineas (git 529 344)", () => {
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
      await deleteAlgorithm(algorithmName, true);
      await storeAlgorithmApply(algorithmV1);

      await delay(2000);
      await storePipeline(d);
      const res = await runStored(pipe);
      const jobId = res.body.jobId;
      await delay(3000);

      const pause = await pausePipeline(jobId);
      await delay(3000);
      let pipelineStatus = await getPipelineStatus(jobId);
      expect(pipelineStatus.body.status).to.be.equal("paused");
      const resume = await resumePipeline(jobId);
      const result = await getResult(jobId, 200);
    }).timeout(1000 * 60 * 5);

    it("pause resume pipeline multiple batch", async () => {
      const e = deconstructTestData(testData5);
      await deletePipeline(e);
      await storePipeline(e);

      const res = await runStored(e);
      const jobId = res.body.jobId;
      await delay(3000);

      const pause = await pausePipeline(jobId);
      await delay(60000);
      let pipelineStatus = await getPipelineStatus(jobId);
      expect(pipelineStatus.body.status).to.be.equal("paused");
      const resume = await resumePipeline(jobId);
      const result = await getResult(jobId, 200);
    }).timeout(1000 * 60 * 20);

    it("pause stop pipeline", async () => {
      const pipe = {
        name: d.name,
        flowInput: {
          inp: 15000,
        },
      };
      await deleteAlgorithm(algorithmName, true);
      await storeAlgorithmApply(algorithmV1);

      await delay(2000);
      await storePipeline(d);
      const res = await runStored(pipe);
      const jobId = res.body.jobId;
      await delay(3000);

      const pause = await pausePipeline(jobId);
      await delay(3000);
      let pipelineStatus = await getPipelineStatus(jobId);

      const stop = await stopPipeline(jobId);
      const result = await getPipelineStatus(jobId);
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
      await deletePipeline(d);
      await storePipeline(d);

      for (i = 0; i < 20; i++) {
        var parents = await Promise.all([
          runStored(pipe3),
          runStored(pipe3),
          runStored(pipe3),
          runStored(pipe3),
          timeout(900),
        ]);
        pipe3JobId.push(parents);
      }

      const first = await getPipelineStatus(getJobId(pipe3JobId[0]));
      const last = await getPipelineStatus(getJobId(pipe3JobId[19]));

      await deletePipeline(d);

      const firstAfter = await getPipelineStatus(getJobId(pipe3JobId[0]));
      const lastAfter = await getPipelineStatus(getJobId(pipe3JobId[19]));

      expect(first.body.status).to.be.equal("active");
      expect(last.body.status).to.be.equal("pending");
      expect(firstAfter.body.status).to.be.equal("stopped");
      expect(lastAfter.body.status).to.be.equal("stopped");
    }).timeout(1000 * 60 * 25);
    describe("pipeline options", async () => {
      const d = deconstructTestData(ttlPipe);

      it("pipeline ttl ", async () => {
        await deletePipeline(d);
        await storePipeline(d);
        const ttl = {
          name: d.name,
          flowInput: {
            inputs: [50000],
          },
          options: {
            ttl: 10,
            activeTtl: 130,
          },
        };
        const jobId2 = await runStored(ttl); //should be stoped  due to ttl
        await timeout(30000);
        await celeanPipeLines();
        const currentStatus = await getPipelineStatus(jobId2.body.jobId);
        expect(currentStatus.body.status).to.be.equal("stopped");
        expect(currentStatus.body.reason).to.be.equal("pipeline expired");
      }).timeout(1000 * 60 * 5);

      it.only("pipeline active ttl", async () => {
        const algorithmName = "algoNotImage";
        
        await deletePipeline(d);
        await deleteAlgorithm(algorithmName, true);
  
        const testAlgPath = "docker.io/hkubedevtest/test"; 
        const testAlg = algJson(algorithmName, testAlgPath);
        await storeAlgorithmApply(testAlg);
        await delay(2000);

        d.nodes = [
          {
              "kind": "algorithm",
              "nodeName": "node1",
              "algorithmName": "algoNotImage",
              
          }
        ]

        await storePipeline(d);

        const ttl = {
          name: d.name,
          flowInput: {
            inputs: [25000],
          },
          options: {
            ttl: 25,
            activeTtl: 15,
          },
        };

        const jobId = await runStored(ttl);

        await timeout(20000);
        const cealn = await celeanPipeLines();
        const currentStatus = await getPipelineStatus(jobId.body.jobId);
        expect(currentStatus.body.status).to.be.equal("stopped");
        expect(currentStatus.body.reason).to.be.equal(
          "pipeline active TTL expired"
        );

        
      }).timeout(1000 * 60 * 5);
      it(" concurrentPipelines - pending  pipeline", async () => {
        //set test data to testData1
        const d = deconstructTestData(testData12);
        await deletePipeline(d.name);
        d.pipeline.options = {
          concurrentPipelines: {
            amount: 1,
            rejectOnFailure: false,
          },
        };
        //store pipeline evalwait
        await storePipeline(d);
        //run the pipeline evalwait  twice the second time will be pending till the first exection completed
        await runStored(d);

        const res = await runStored(d);
        const jobId = res.body.jobId;
        const currentStatus = await getPipelineStatus(jobId);

        expect(currentStatus.body.status).to.have.equal("pending");

        await deletePipeline(d.name);
      }).timeout(1000 * 60 * 5);

      it(" concurrentPipelines - continu to complete pending   pipeline", async () => {
        //run the pipeline evalwait  20 times validate that all the 20 executed

        //set test data to testData1
        const d = deconstructTestData(testData12);
        await deletePipeline(d.name);
        d.pipeline.options = {
          concurrentPipelines: {
            amount: 4,
            rejectOnFailure: false,
          },
        };
        //store pipeline evalwait
        await storePipeline(d);
        let pipe3JobId = "";
        for (i = 0; i < 5; i++) {
          var parents = await Promise.all([
            runStored(d),
            runStored(d),
            runStored(d),
            runStored(d),
            timeout(900),
          ]);
          pipe3JobId = parents;
        }

        const result2 = await getResult(getJobId(pipe3JobId), 200);

        expect(result2.status).to.be.equal("completed");
        await deletePipeline(d.name);
      }).timeout(1000 * 60 * 5);
    });
  });
  describe("Trigger pipeline ", () => {
    it("Trigger tree", async () => {
      const testData = testData2;

      const simpleName = testData.descriptor.name.toString();
      const simple = deconstructTestData(testData);
      await deletePipeline(simple);
      await storePipeline(simple);
      const triggeredPipe = pipelineRandomName(8);
      const triggeredPipe2 = pipelineRandomName(8);
      testData.descriptor.name = triggeredPipe;
      testData.descriptor.triggers.pipelines = [simpleName];
      testData.descriptor.nodes[0].input[0] = "[1,2]";
      const d = deconstructTestData(testData);
      await deletePipeline(d);
      await storePipeline(d);

      testData.descriptor.name = triggeredPipe2;
      testData.descriptor.triggers.pipelines = [triggeredPipe];
      testData.descriptor.nodes[0].input[0] = "[1,2]";
      const e = deconstructTestData(testData);
      await deletePipeline(e);
      await storePipeline(e);
      const tree = await getPipelineTriggerTree(simpleName);

      await deletePipeline(triggeredPipe);
      await deletePipeline(triggeredPipe2);
      expect(tree.text).to.include(triggeredPipe);
      expect(tree.text).to.include(triggeredPipe2);
    }).timeout(1000 * 60 * 7);

    it("Trigger get result tree", async () => {
      const testData = testData2;

      const simpleName = testData.descriptor.name;
      const simple = deconstructTestData(testData);
      await deletePipeline(simple);
      await storePipeline(simple);
      const triggeredPipe = pipelineRandomName(8);
      const triggeredPipe2 = pipelineRandomName(8);
      testData.descriptor.name = triggeredPipe;
      testData.descriptor.triggers.pipelines = [simpleName];
      testData.descriptor.nodes[0].input[0] = "[1,2]";
      const d = deconstructTestData(testData);
      await deletePipeline(d);
      await storePipeline(d);

      testData.descriptor.name = triggeredPipe2;
      testData.descriptor.triggers.pipelines = [triggeredPipe];
      testData.descriptor.nodes[0].input[0] = "[1,2]";
      const e = deconstructTestData(testData);
      await deletePipeline(e);
      await storePipeline(e);
      //getJobIdsTree
      const jobId = await runStoredAndWaitForResults(simple);

      const tree = await getJobIdsTree(jobId);
      const firstChildJobId = tree.body.children.filter(
        (a) => a.name == triggeredPipe
      )[0].jobId;
      await getResult(firstChildJobId, 200);
      const tree1 = await getJobIdsTree(jobId);
      const secondChild = tree1.body.children
        .filter((a) => a.name == triggeredPipe)
        .filter((a) => (a.name = triggeredPipe2));
      expect(secondChild.length).to.be.equal(1);
      await deletePipeline(triggeredPipe);
      await deletePipeline(triggeredPipe2);
    }).timeout(1000 * 60 * 7);

    it("Trigger cycle pipeline tree", async () => {
      const testData = testData2;
      const triggeredPipe = pipelineRandomName(8);
      const triggeredPipe2 = pipelineRandomName(8);
      testData.descriptor.triggers.pipelines = [triggeredPipe2];
      const simpleName = testData.descriptor.name;
      const simple = deconstructTestData(testData);
      await deletePipeline(simple);
      await storePipeline(simple);

      testData.descriptor.name = triggeredPipe;
      testData.descriptor.triggers.pipelines = [simpleName];
      testData.descriptor.nodes[0].input[0] = "[1,2]";
      const d = deconstructTestData(testData);
      await deletePipeline(d);
      await storePipeline(d);

      testData.descriptor.name = triggeredPipe2;
      testData.descriptor.triggers.pipelines = [triggeredPipe];
      testData.descriptor.nodes[0].input[0] = "[1,2]";
      const e = deconstructTestData(testData);
      await deletePipeline(e);
      await storePipeline(e);

      const tree = await getPipelineTriggerTree("");
      await deletePipeline(triggeredPipe);
      await deletePipeline(triggeredPipe2);
      await deletePipeline(simpleName);
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
      await deletePipeline(d);
      const a = await storePipeline(d);

      d.pipeline.name = d.name = priority1;
      d.pipeline.priority = 1;
      await deletePipeline(d);
      const ab = await storePipeline(d);

      for (i = 0; i < 4; i++) {
        var parents = await Promise.all([
          runStored(pipe3),
          runStored(pipe3),
          runStored(pipe3),
          runStored(pipe3),
          timeout(900),
        ]);
        printJobId(parents);
        pipe3JobId = parents;
      }

      for (i = 0; i < 4; i++) {
        var parents = await Promise.all([
          runStored(pipe1),
          runStored(pipe1),
          runStored(pipe1),
          runStored(pipe1),
          timeout(900),
        ]);
        pipe1JobId = parents;
      }
      //timeout!!
      const result1 = await getResult(getJobId(pipe1JobId), 200);
      const result2 = await getResult(getJobId(pipe3JobId), 200);
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
        loadRunStored(load);
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
            loadRunStored(pipe3);
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
            loadRunStored(pipe3);
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
      await deletePipeline(d);
      await storePipeline(d);
      const res2 = await runStored(pipe);
      await delay(2000);
      pipe.priority = 1;
      const res1 = await runStored(pipe);
      // write_log(res.body)
      const jobId1 = res1.body.jobId;
      const jobId2 = res2.body.jobId;

      const result1 = await getResult(jobId1, 200);
      const result2 = await getResult(jobId2, 200);
      expect(result1.timeTook).to.be.lessThan(result2.timeTook);
    }).timeout(1000 * 60 * 2);

    it("Different priority Pipelines with Different algorithm", async () => {
      const testDataA = testData11;
      const d = deconstructTestData(testData11);
      await deletePipeline(d);
      await storePipeline(d);
      const pipe = {
        name: d.name,
        flowInput: {
          range: 1000,
          inputs: 6000,
        },
        priority: 3,
      };
      testData11.descriptor.name = testData11.descriptor.name + "2";
      const d2 = deconstructTestData(testDataA);
      await deletePipeline(d2);
      const r = await storePipeline(d2);
      const res2 = await runStored(pipe);
      await delay(5000);
      pipe.name = d2.name;
      pipe.priority = 1;
      const res1 = await runStored(pipe);
      const jobId1 = res1.body.jobId;
      const jobId2 = res2.body.jobId;

      const result1 = await getResult(jobId1, 200, 1000 * 60 * 19);
      const result2 = await getResult(jobId2, 200, 1000 * 60 * 19);
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
      await deletePipeline(d);
      await storePipeline(d);
      const res2 = await runStored(pipe);
      await delay(1000);
      pipe.flowInput.range = 100;
      const res1 = await runStored(pipe);
      const jobId1 = res1.body.jobId;
      const jobId2 = res2.body.jobId;

      const result1 = await getResult(jobId1, 200, 1000 * 60 * 19);
      const result2 = await getResult(jobId2, 200, 1000 * 60 * 19);
      expect(result1.timeTook).to.be.lessThan(result2.timeTook);
    }).timeout(1000 * 60 * 20);
  });
});
