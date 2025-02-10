const chai = require("chai");
const expect = chai.expect;
const chaiHttp = require("chai-http");
const delay = require("delay");

const {
  deletePod,
  filterPodsByName,
  deleteJob,
  filterjobsByName,
} = require("../utils/kubeCtl");

const {
  runAlgorithm,
  deleteAlgorithm,
  storeAlgorithmApply,
} = require("../utils/algorithmUtils");

const { 
  intervalDelay,
} = require('../utils/misc_utils');

const {
  testData1,
  testData2,
  testData3,
  testData402,
  testData403,
  testData405,
  outputPipe,
} = require("../config/index").nodeTest;

const { getRawGraph, getResult } = require("../utils/results");

// const KubernetesClient = require('@hkube/kubernetes-client').Client;
const {
  deconstructTestData,
  runStored,
  pipelineRandomName,
  runRaw,
  deletePipeline,
  storePipeline,
  runStoredAndWaitForResults,
  checkResults,
  exceCachPipeline,
} = require("../utils/pipelineUtils");

chai.use(chaiHttp);

describe("Node Tests git 660", () => {

  beforeEach(function () {
    console.log('\n-----------------------------------------------\n');
  });

  describe("single node batch input", () => {
    const pipe = {
      name: "Athos-Cartesian",
      nodes: [
        {
          nodeName: "one",
          algorithmName: "eval-alg",
          input: [1],
          batchOperation: "indexed", //cartesian
        },
      ],
    };

    it("single batch indexed", async () => {
      pipe.name = "single_batch_index";
      pipe.nodes[0].input = ["#[0...9]"];
      pipe.nodes[0].batchOperation = "indexed";
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      expect(result.data.length).to.be.equal(10);
    }).timeout(1000 * 60 * 2);

    it("two batch indexed", async () => {
      pipe.nodes[0].input = ["#[0...9]", "#[10,20,30]"];
      pipe.name = "two_batch_index";
      pipe.nodes[0].batchOperation = "indexed";
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      expect(result.data.length).to.be.equal(10);
    }).timeout(1000 * 60 * 2);

    it("two batch one object indexed", async () => {
      pipe.name = "two_batch_one_object_index";
      pipe.nodes[0].input = [{ data: "stam" }, "#[0...9]", "#[10,20,30]"];
      pipe.nodes[0].batchOperation = "indexed";
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      expect(result.data.length).to.be.equal(10);
    }).timeout(1000 * 60 * 2);

    it("single batch cartesian", async () => {
      pipe.name = "single_batch_cartesian";
      pipe.nodes[0].input = ["#[0...9]"];
      pipe.nodes[0].batchOperation = "cartesian";
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      expect(result.data.length).to.be.equal(10);
    }).timeout(1000 * 60 * 2);

    it("two batch cartesian", async () => {
      pipe.name = "two_batch_cartesian";
      pipe.nodes[0].input = ["#[0...9]", "#[10,20,30]"];
      pipe.nodes[0].batchOperation = "cartesian";
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      expect(result.data.length).to.be.equal(30);
    }).timeout(1000 * 60 * 2);

    it("two batch one object cartesian", async () => {
      pipe.name = "two_batch_one_object_cartesian";
      pipe.nodes[0].input = [{ data: "stam" }, "#[0...9]", "#[10,20,30]"];
      pipe.nodes[0].batchOperation = "cartesian";
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      expect(result.data.length).to.be.equal(30);
    }).timeout(1000 * 60 * 2);

    it("two batch two object cartesian", async () => {
      pipe.name = "two_batch_two_object_cartesian";
      pipe.nodes[0].input = [
        { date: "now" },
        { data: "stam" },
        "#[0...9]",
        "#[10,20,30]",
      ];
      pipe.nodes[0].batchOperation = "cartesian";
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      console.log(result.data.length);
      console.log(result.data[0].result);
      expect(result.data.length).to.be.equal(30);

      expect(result.data[0].result.length).to.be.equal(4);
    }).timeout(1000 * 60 * 2);

    it("two batch indexed python", async () => {
      pipe.name = "two_batch_index_python";
      pipe.nodes[0].input = ["add", "#[0...9]", "#[10,20,30]"];
      pipe.nodes[0].algorithmName = "green-alg";
      pipe.nodes[0].batchOperation = "indexed";
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      expect(result.data.length).to.be.equal(10);
    }).timeout(1000 * 60 * 2);
  });

  describe("pipe line cach input data", () => {
    const pipe = {
      name: "nodeAdd19",
      nodes: [
        {
          nodeName: "one",
          algorithmName: "eval-alg",
          input: ["@flowInput.range"],
          extraData: {
            code: [
              "(input) => {",
              "const range=  input[0]+7;",
              "return range }",
            ],
          },
        },
        {
          nodeName: "two",
          algorithmName: "eval-alg",
          input: ["@one"],
          extraData: {
            code: [
              "(input) => {",
              "const range=  input[0]+12;",
              "return range }",
            ],
          },
        },
      ],
      experimentName: "main",
      options: {
        ttl: 3600,
        batchTolerance: 80,
        progressVerbosityLevel: "info",
      },
      flowInput: {
        range: 10,
      },
      priority: 3,
    };

    it("run node get data from flowInput", async () => {
      const expectedResult = 29;
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);

      const job2 = await exceCachPipeline(jobId, "one");
      const res2 = await await getResult(job2.body.jobId, 200);
      const job3 = await exceCachPipeline(jobId, "two");
      const res3 = await await getResult(job3.body.jobId, 200);

      expect(result.data[0].result).to.be.equal(expectedResult);
      expect(res3.data[0].result).to.be.equal(expectedResult);
      expect(res2.data[0].result).to.be.equal(expectedResult);
    }).timeout(1000 * 60 * 2);
  });

  describe("pipe line batch input", () => {
    const pipe = {
      name: "Athos-Cartesian",
      nodes: [
        {
          nodeName: "one",
          algorithmName: "eval-alg",
          input: [1],
        },
        {
          nodeName: "two",
          algorithmName: "eval-alg",
          input: ["#@one"],
        },
        {
          nodeName: "three",
          algorithmName: "eval-alg",
          input: ["#@one", "#@two"],
          batchOperation: "indexed", //cartesian
        },
      ],
    };

    it("batch indexed", async () => {
      pipe.nodes[0].input = ["#[0...9]"];
      pipe.nodes[1].input = ["#[10...19]"];
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      expect(result.data.length).to.be.equal(10);
      expect(JSON.stringify(result.data[7].result)).to.be.equal(
        JSON.stringify([[7], [17]])
      );
    }).timeout(1000 * 60 * 2);

    it("batch cartesian", async () => {
      pipe.nodes[0].input = ["#[0...9]"];
      pipe.nodes[1].input = ["#[10...14]"];
      pipe.nodes[2].input = ["#@one", "#@two"];
      pipe.nodes[2].batchOperation = "cartesian";
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      expect(result.data.length).to.be.equal(50);
      expect(JSON.stringify(result.data[37].result)).to.be.equal(
        JSON.stringify([[7], [12]])
      );
      expect(JSON.stringify(result.data[49].result)).to.be.equal(
        JSON.stringify([[9], [14]])
      );
    }).timeout(1000 * 60 * 2);

    it("batch + fix cartesian", async () => {
      pipe.nodes[0].input = ["#[0...9]"];
      pipe.nodes[1].input = ["#[10...14]"];
      pipe.nodes[2].input = ["99", "#@one", "#@two"];
      pipe.nodes[2].batchOperation = "cartesian";
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      expect(result.data.length).to.be.equal(50);
      console.log(result.data[37].result);
      expect(JSON.stringify(result.data[37].result)).to.be.equal(
        JSON.stringify(["99", [7], [12]])
      );
      expect(JSON.stringify(result.data[49].result)).to.be.equal(
        JSON.stringify(["99", [9], [14]])
      );
    }).timeout(1000 * 60 * 2);

    it("batch + fix indexed", async () => {
      pipe.nodes[0].input = ["#[0...9]"];
      pipe.nodes[1].input = ["#[10...14]"];
      pipe.nodes[2].input = ["99", "#@one", "#@two"];
      pipe.nodes[2].batchOperation = "indexed";
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      expect(result.data.length).to.be.equal(10);
      expect(JSON.stringify(result.data[7].result)).to.be.equal(
        JSON.stringify(["99", [7], null])
      );
      expect(JSON.stringify(result.data[4].result)).to.be.equal(
        JSON.stringify(["99", [4], [14]])
      );
    }).timeout(1000 * 60 * 2);

    it("any on batch", async () => {
      pipe.nodes[0].input = ["#[0...9]"];
      pipe.nodes[1].input = ["#[10...14]"];
      pipe.nodes[2].input = ["*@one", "#@two"];
      pipe.nodes[2].batchOperation = "indexed";
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      expect(result.data.length).to.be.equal(50);

      // console.log(JSON.stringify(result.data[37].result))
      // console.log(JSON.stringify(result.data[49].result))
      // expect(JSON.stringify(result.data[37].result)).to.be.equal(JSON.stringify([[7],[12]]))
      // expect(JSON.stringify(result.data[49].result)).to.be.equal(JSON.stringify([[9],[14]]))
    }).timeout(1000 * 60 * 2);
  });

  describe("pipe flowInput line batch input", () => {
    const pipe = {
      name: "Athos-Cartesian",
      nodes: [
        {
          nodeName: "one",
          algorithmName: "eval-alg",
          input: ["#@flowInput.one"],
        },
        {
          nodeName: "two",
          algorithmName: "eval-alg",
          input: ["#@flowInput.two"],
        },
        {
          nodeName: "three",
          algorithmName: "eval-alg",
          input: ["#@one", "#@two"],
          batchOperation: "indexed", //cartesian
        },
      ],
      flowInput: {},
    };

    it("flowInput batch cartesian", async () => {
      pipe.nodes[0].input = ["#@flowInput.one", "#@flowInput.two"];
      pipe.nodes[0].batchOperation = "cartesian";
      pipe.nodes[2].batchOperation = "cartesian";
      pipe.flowInput.one = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      pipe.flowInput.two = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      expect(result.data.length).to.be.equal(1000);
      expect(JSON.stringify(result.data[999].result)).to.be.equal(
        JSON.stringify([[9, 19], [19]])
      );
      expect(JSON.stringify(result.data[17].result)).to.be.equal(
        JSON.stringify([[0, 11], [17]])
      );
    }).timeout(1000 * 60 * 2);

    it("flowInput batch index", async () => {
      pipe.nodes[0].input = ["#@flowInput.one", "#@flowInput.two"];
      pipe.nodes[0].batchOperation = "cartesian";
      pipe.nodes[2].batchOperation = "indexed";
      pipe.flowInput.one = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      pipe.flowInput.two = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      expect(result.data.length).to.be.equal(100);
      expect(JSON.stringify(result.data[99].result)).to.be.equal(
        JSON.stringify([[9, 19], null])
      );
      expect(JSON.stringify(result.data[9].result)).to.be.equal(
        JSON.stringify([[0, 19], [19]])
      );
    }).timeout(1000 * 60 * 2);

    it("flowInput batch +any ", async () => {
      pipe.nodes[0].input = ["#@flowInput.one", "#@flowInput.two"];
      pipe.nodes[0].batchOperation = "cartesian";
      pipe.nodes[2].input = ["*@one", "#@two"];
      pipe.nodes[2].batchOperation = "cartesian";
      pipe.flowInput.one = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      pipe.flowInput.two = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);

      expect(result.data.length).to.be.equal(1000);
      //  expect(JSON.stringify(result.data[99].result)).to.be.equal("[[0,19],[19]]")
    }).timeout(1000 * 60 * 2);

    it("a batch + fix indexed", async () => {
      pipe.nodes[0].input = ["#[0...9]"];
      pipe.nodes[1].input = ["#[10...15]"];
      pipe.nodes[2].input = ["99", "#@one", "#@two"];
      pipe.nodes[2].batchOperation = "indexed";
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      expect(result.data.length).to.be.equal(10);
      expect(JSON.stringify(result.data[7].result)).to.be.equal(
        JSON.stringify(["99", [7], null])
      );
      expect(JSON.stringify(result.data[4].result)).to.be.equal(
        JSON.stringify(["99", [4], [14]])
      );
    }).timeout(1000 * 60 * 2);

    it("custom input", async () => {
      pipe.nodes[0].input = ["#[0...9]"];
      pipe.nodes[1].input = ["#[10...19]"];
      pipe.nodes[2].input = [{ a: "@one", b: "@two" }];
      pipe.nodes[2].batchOperation = "indexed";
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      expect(result.data.length).to.be.equal(1);
      expect(result.data[0].result[0].a.length).to.be.equal(10);
      expect(result.data[0].result[0].b.length).to.be.equal(10);
    }).timeout(1000 * 60 * 2);

    it("flowInput = null", async () => {
      pipe.nodes[0].input = ["#@flowInput.one", "#@flowInput.two"];
      pipe.nodes[0].batchOperation = "cartesian";
      pipe.nodes[2].input = ["#@one", "#@two"];

      pipe.flowInput.one = null;
      pipe.flowInput.two = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      await getResult(jobId, 200);
    }).timeout(1000 * 60 * 2);

    it("caching (Run Node) batch index", async () => {
      pipe.nodes[0].input = ["#@flowInput.one", "#@flowInput.two"];
      pipe.nodes[0].batchOperation = "cartesian";
      pipe.nodes[2].input = ["#@one", "#@two"];
      pipe.nodes[2].batchOperation = "indexed";
      pipe.flowInput.one = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      pipe.flowInput.two = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const orgRes = await getResult(jobId, 200);

      const res2 = await exceCachPipeline(jobId, "three");
      const jobId2 = res2.body.jobId;
      const cachRes = await getResult(jobId2, 200);

      expect(JSON.stringify(orgRes.data) == JSON.stringify(cachRes.data)).to.be
        .true;
    }).timeout(1000 * 60 * 2);

    it("caching (Run Node) batch index flowInput", async () => {
      pipe.nodes[0].input = ["#@flowInput.one", "#@flowInput.two"];
      pipe.nodes[0].batchOperation = "cartesian";
      pipe.nodes[2].input = ["#@one", "#@two"];
      pipe.nodes[2].batchOperation = "indexed";
      pipe.flowInput.one = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      pipe.flowInput.two = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const orgRes = await getResult(jobId, 200);

      const res2 = await exceCachPipeline(jobId, "one");
      const jobId2 = res2.body.jobId;
      const cachRes = await getResult(jobId2, 200);

      expect(JSON.stringify(orgRes.data) == JSON.stringify(cachRes.data)).to.be
        .true;
    }).timeout(1000 * 60 * 2);

    it("caching (Run Node) flowInput batch cartesian", async () => {
      pipe.nodes[0].input = ["#@flowInput.one", "#@flowInput.two"];
      pipe.nodes[0].batchOperation = "cartesian";
      pipe.nodes[2].batchOperation = "cartesian";
      pipe.flowInput.one = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      pipe.flowInput.two = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const orgRes = await getResult(jobId, 200);
      const res2 = await exceCachPipeline(jobId, "three");
      const jobId2 = res2.body.jobId;
      const cachRes = await getResult(jobId2, 200);

      expect(JSON.stringify(orgRes.data) == JSON.stringify(cachRes.data)).to.be
        .true;
    }).timeout(1000 * 60 * 2);

    it("caching (Run Node) batch + fix indexed", async () => {
      pipe.nodes[0].input = ["#[0...9]"];
      pipe.nodes[1].input = ["#[10...15]"];
      pipe.nodes[2].input = ["99", "#@one", "#@two"];
      pipe.nodes[2].batchOperation = "indexed";
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const orgRes = await getResult(jobId, 200);
      const res2 = await exceCachPipeline(jobId, "three");
      const jobId2 = res2.body.jobId;
      const cachRes = await getResult(jobId2, 200);

      expect(JSON.stringify(orgRes.data) == JSON.stringify(cachRes.data)).to.be
        .true;
    }).timeout(1000 * 60 * 2);

    it("caching (Run Node) batch + any", async () => {
      pipe.nodes[0].input = ["#@flowInput.one", "#@flowInput.two"];
      pipe.nodes[0].batchOperation = "cartesian";
      pipe.nodes[2].input = ["*@one", "#@two"];
      pipe.nodes[2].batchOperation = "cartesian";
      pipe.flowInput.one = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      pipe.flowInput.two = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const orgRes = await getResult(jobId, 200);

      const res2 = await exceCachPipeline(jobId, "three");
      expect(res2.status).to.be.equal(400);
      expect(res2.body.error.message).to.be.equal(
        "relation waitAny for node three is not allowed"
      );
    }).timeout(1000 * 60 * 2);

    it("caching (Run Node) on cached pipeline", async () => {
      pipe.nodes[0].input = ["#@flowInput.one", "#@flowInput.two"];
      pipe.nodes[0].batchOperation = "cartesian";
      pipe.nodes[1].input = ["#@one"];
      pipe.nodes[2].input = ["#@two"];

      pipe.flowInput.one = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      pipe.flowInput.two = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
      const res = await runRaw(pipe);
      const jobId = res.body.jobId;
      const orgRes = await getResult(jobId, 200);

      const res2 = await exceCachPipeline(jobId, "two");
      const jobId2 = res2.body.jobId;
      await getResult(jobId2, 200);

      const res3 = await exceCachPipeline(jobId2, "three");
      const jobId3 = res3.body.jobId;
      const cachRes = await getResult(jobId3, 200);

      expect(JSON.stringify(orgRes.data) == JSON.stringify(cachRes.data)).to.be
        .true;
    }).timeout(1000 * 60 * 2);
  });

  describe("Fail scheduling", () => {
    const algName = pipelineRandomName(8).toLowerCase();
    const alg8cpu = {
      name: `${algName}`,
      algorithmImage: "hkube/algorunner",
      cpu: 8,
      mem: "1Gi",
      options: {
        debug: false,
        pending: false,
      },
      minHotWorkers: 0,
      type: "Image",
      workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 2000 }
    };

    it("node fail scheduling due to lack of resource", async () => {
      await storeAlgorithmApply(alg8cpu);
      const alg = { name: algName, input: [] };
      const res = await runAlgorithm(alg);
      await intervalDelay("Waiting", 90 * 1000);
      const graph = await getRawGraph(res.body.jobId);
      expect(graph.body.nodes[0].status).to.be.equal("failedScheduling");
    }).timeout(1000 * 60 * 3);

    after(async () => {
      await deleteAlgorithm(algName);
    });
  });

  describe("some test", () => {
    it("skip batch node if input is null", async () => {
      const testData = testData3;
      const d = deconstructTestData(testData);
      await deletePipeline(d);
      await storePipeline(d);
      const jobId = await runStoredAndWaitForResults(d);

      const graph = await getRawGraph(jobId);

      expect(graph.body.nodes[1].batch[0].status).to.be.equal("skipped");
    }).timeout(1000 * 60 * 3);

    it("node get data from batch after batch was killed", async () => {
      const testData = testData1;
      const d = deconstructTestData(testData);
      await deletePipeline(d);
      await storePipeline(d);
      const jobId = await runStored(d);
      await delay(15000);
      const jobs = await filterjobsByName("green-alg");
      console.log(jobs);

      const del = jobs.map((e) => {
        return deleteJob(e.metadata.name);
      });
      await Promise.all(del);
      const pods = await filterPodsByName("green-alg");

      const delpod = pods.map((e) => {
        return deletePod(e.metadata.name);
      });
      await Promise.all(delpod);

      const result = await getResult(jobId, 200);
      expect(result.status).to.be.equal("completed");
    }).timeout(1000 * 60 * 2);
  });

  describe("TID-410- different input types ~", () => {
    it("integers", async () => {
      //set test data to testData1
      const d = deconstructTestData(testData402);
      await deletePipeline(d);
      const pipe = {
        name: d.name,
        flowInput: {
          addInput: [3, 5],
          multInput: [8],
        },
      };

      //store pipeline addmuldiv
      await storePipeline(d);
      const res = await runStored(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      // let diff = []
      expect(result.data[0].result).to.be.equal(64);
    }).timeout(1000 * 60 * 5);

    it("float", async () => {
      //set test data to testData1
      const d = deconstructTestData(testData402);
      await deletePipeline(d);
      const pipe = {
        name: d.name,
        flowInput: {
          addInput: [2.5, 3.4],
          multInput: [1.35],
        },
      };

      //store pipeline addmuldiv
      await storePipeline(d);
      const res = await runStored(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      // let diff = []
      expect(result.data[0].result).to.be.closeTo(7.965, 0.001);
    }).timeout(1000 * 60 * 5);

    it("string", async () => {
      //set test data to testData1
      const d = deconstructTestData(testData405);
      await deletePipeline(d);
      const pipe = {
        name: d.name,
        flowInput: {
          inputs: ["hello world", "world", "earth"],
        },
      };

      //store pipeline addmuldiv
      await storePipeline(d);
      const res = await runStored(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      // let diff = []
      expect(result.data[0].result).to.be.equal("hello earth");
    }).timeout(1000 * 60 * 5);

    it("bool true", async () => {
      //set test data to testData1
      const d = deconstructTestData(testData403);
      await deletePipeline(d);
      const pipe = {
        name: d.name,
        flowInput: {
          inputs: true,
        },
      };

      //store pipeline addmuldiv
      await storePipeline(d);
      const res = await runStored(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      // let diff = []
      expect(result.data[0].result).to.be.equal(true);
      await deletePipeline(d);
    }).timeout(1000 * 60 * 5);

    it("bool false", async () => {
      //set test data to testData1
      const d = deconstructTestData(testData403);
      await deletePipeline(d);
      const pipe = {
        name: d.name,
        flowInput: {
          inputs: false,
        },
      };

      //store pipeline addmuldiv
      await storePipeline(d);
      const res = await runStored(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      // let diff = []
      expect(result.data[0].result).to.be.equal(false);
      await deletePipeline(d);
    }).timeout(1000 * 60 * 5);

    it("bool object type", async () => {
      //set test data to testData1
      const d = deconstructTestData(testData403);
      await deletePipeline(d);
      const pipe = {
        name: d.name,
        flowInput: {
          inputs: {
            name: "hkube",
            type: "type1",
            prop: ["prop1", "prop2", "prop3", 4, 7, 89.022, -987],
          },
        },
      };

      //store pipeline addmuldiv
      await storePipeline(d);
      const res = await runStored(pipe);
      const jobId = res.body.jobId;
      const result = await getResult(jobId, 200);
      // let diff = []
      expect(result.data[0].result).to.be.deep.equal(pipe.flowInput.inputs);
      await deletePipeline(d);
    }).timeout(1000 * 60 * 5);
  });

  describe("TID_110 - batchTolerance - algorithm completed with failure (git 60 86)", () => {
    const dataSort = (obj) => {
      testData2.descriptor.options = obj.options;
      testData2.descriptor.flowInput = obj.flowInput;
    };

    it("should complete the pipeline, 100 percent tolerance with one fail", async () => {
      const obj = {
        flowInput: {
          nums: [1, 24, 3, 4, 5],
        },

        options: {
          batchTolerance: 100,
          progressVerbosityLevel: "debug",
        },
      };

      dataSort(obj);

      const d = testData2.descriptor;
      //store pipeline
      await storePipeline(d);

      const res = await runStored(d.name);

      await checkResults(res, 200, "completed", d, true);
    }).timeout(5000000);

    it("should fail the pipeline, 20 percent tolerance with one fail", async () => {
      const obj = {
        flowInput: {
          nums: [1, 24, 3, 4, 5],
        },

        options: {
          batchTolerance: 20,
          progressVerbosityLevel: "debug",
        },
      };

      dataSort(obj);
      const d = testData2.descriptor;

      await storePipeline(d);
      const res = await runStored(d.name);

      await checkResults(res, 200, "failed", d, true);
    }).timeout(5000000);

    it("should complete the pipeline, 60 percent tolerance with one fail", async () => {
      const obj = {
        flowInput: {
          nums: [1, 24, 3, 4, 5],
        },

        options: {
          batchTolerance: 60,
          progressVerbosityLevel: "debug",
        },
      };

      dataSort(obj);
      const d = testData2.descriptor;

      await storePipeline(d);
      const res = await runStored(d.name);

      await checkResults(res, 200, "completed", d, true);
    }).timeout(5000000);

    it("should fail the pipeline, -2 percent tolerance with one fail", async () => {
      const obj = {
        flowInput: {
          nums: [1, 24, 3, 4, 5],
        },

        options: {
          batchTolerance: -2,
          progressVerbosityLevel: "debug",
        },
      };

      dataSort(obj);
      const d = testData2.descriptor;

      const res = await storePipeline(d);

      expect(res.status).to.eql(400);
      expect(res.body).to.have.property("error");
      expect(res.body.error.message).to.include(
        "batchTolerance should be >= 0"
      );

      await deletePipeline(d);
    }).timeout(5000000);

    it("should fail the pipeline, 101 percent tolerance with one fail", async () => {
      const obj = {
        flowInput: {
          nums: [1, 24, 3, 4, 5],
        },

        options: {
          batchTolerance: 101,
          progressVerbosityLevel: "debug",
        },
      };

      dataSort(obj);
      const d = testData2.descriptor;

      const res = await storePipeline(d);

      expect(res.status).to.eql(400);
      expect(res.body).to.have.property("error");
      expect(res.body.error.message).to.include(
        "batchTolerance should be <= 100"
      );

      await deletePipeline(d);
    }).timeout(5000000);

    it("should fail the pipeline, 20.6 percent tolerance with one fail", async () => {
      const obj = {
        flowInput: {
          nums: [1, 24, 3, 4, 5],
        },

        options: {
          batchTolerance: 20.6,
          progressVerbosityLevel: "debug",
        },
      };

      dataSort(obj);
      const d = testData2.descriptor;

      const res = await storePipeline(d);
      expect(res.status).to.eql(400);

      expect(res.body).to.have.property("error");
      expect(res.body.error.message).to.include(
        "batchTolerance should be integer"
      );

      await deletePipeline(d);
    }).timeout(5000000);

    it('should fail the pipeline, "twenty" percent tolerance with one fail', async () => {
      const obj = {
        flowInput: {
          nums: [1, 24, 3, 4, 5],
        },

        options: {
          batchTolerance: "twenty",
          progressVerbosityLevel: "debug",
        },
      };

      dataSort(obj);
      const d = testData2.descriptor;

      const res = await storePipeline(d);
      expect(res.status).to.eql(400);
      expect(res.body).to.have.property("error");
      expect(res.body.error.message).to.include(
        "batchTolerance should be integer"
      );

      await deletePipeline(d);
    }).timeout(5000000);
  });

  it("output node", async () => {
    const testData = outputPipe;
    const d = deconstructTestData(testData);
    await deletePipeline(d);
    await storePipeline(d);

    const jobId = await runStoredAndWaitForResults(d);
    const result = await getResult(jobId, 200);
    expect(result.data[1].result[0]).to.be.equal('yellow-input')
    expect(result.data[1].result[1]).to.be.equal(42)
    expect(result.data[0].nodeName).to.be.equal('black')
  }).timeout(5000000);
});
