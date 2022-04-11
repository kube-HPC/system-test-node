const axios = require("axios").default;
const path = require("path");
const config = require(path.join(process.cwd(), "config/config"));
const chai = require("chai");
const delay = require("delay");
const {
  getPending,
  stopPipeline,
  storePipeline,
  runStored,
  deconstructTestData,
  runStoredAndWaitForResults,
  deletePipeline,
} = require(path.join(process.cwd(), "utils/pipelineUtils"));
const expect = chai.expect;
const timeout = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const {
  getAllManagedJobs,
  getAllPreferredJobs,
  queueFirst,
  queueAfterTag,
  queueLast,
  queueDeleteByTag,
  deletePreferred,
} = require(path.join(process.cwd(), "utils/preferredUtils"));

const { generateRandomJson } = require(path.join(
  process.cwd(),
  "utils/generateRandomJson"
));
describe("stress tests ", () => {
  describe("run bundel", () => {
    const pipe1 = {
      name: "bundel-1",
      flowInput: {
        inp: {
          sleep: 1,
        },
      },
      webhooks: {
        progress: "http://54.195.234.52:3000/webhook/bundelProgress",
        result: "http://54.195.234.52:3000/webhook/bundelresult",
      },
      options: {
        batchTolerance: 100,
        concurrentPipelines: {
          amount: 15,
          rejectOnFailure: false,
        },
        progressVerbosityLevel: "info",
        ttl: 144000,
        activeTtl: 900,
      },
      tags: ["string"],
      priority: 3,
    };

    it("get pending", async () => {
      const jnk = "11*3+8/9";
      const val = jnk.split(/[^0-9]/);
      const operator = jnk.split(/[0-9]/).join("").split("");
      let jnk2 = [];
      for (i = 0; i < val.length - 1; i++) {
        jnk2.push(val[i]);
        jnk2.push(operator[i]);
      }
      const last = val.length;
      jnk2.push(val[last - 1]);
      let total = 0;
      while (jnk2.length) {
        total += parseFloat(jnk2.shift());
      }
      const res = await getPending();
      const size = res.body.length;
    });

    it("get all jobs", async () => {
      const mange = await getAllManagedJobs(5000);
      const pre = await getAllPreferredJobs(5000);
      console.log(`preferred - ${pre.length}, manage ${mange.length}`);
      const body = {
        jobs: pre.slice(0, 2500),
      };
         await deletePreferred(body)
    }).timeout(1000 * 70 * 60);

    it("queue first", async () => {
      //await queueFirst("bundel119");

      const mange = await getAllManagedJobs(5000);
      const pre = await getAllPreferredJobs(5000);
      console.log(`preferred - ${pre.length}, manage ${mange.length}`);
    });

    it("Manage", async () => {
      let bundel1 = 0;
      let bundel2 = 0;
      const data = generateRandomJson(4);
      pipe1.flowInput.data = data;
      pipe1.name = "bundel1";
    //  jnk = await runStored(pipe1);
    //  console.log(`jnk= ${jnk.text}`)
      //04fhg4bjzcsr ,allt1fkoya5u
      for (j = 0; j < 10; j++) {
        pipe1.name = "bundel1";
        pipe1.tags = [`Bundel${j}`];
        for (i = 0; i < 10; i++) {
          
          await runStored(pipe1);
          bundel1++;
        }

        pipe1.name = "bundel2";

        for (i = 0; i < 10; i++) {
        
          await runStored(pipe1);
          bundel2++;
          // await delay(3*1000)
        }

        console.log(`j=${j}`);
        //  await delay(2*1000)
      }
      console.log(
        `bundel2 - ${bundel2} , bundel1 - ${bundel1} - total ${
          bundel1 + bundel2
        }`
      );
    }).timeout(1000 * 70 * 60);;

    it("Manage No Tag", async () => {
     
      const data = generateRandomJson(4);
      pipe1.flowInput.data = data;
      pipe1.name = "bundel1";
      delete pipe1.tags
        pipe1.name = "bundel1";
        
        for (i = 0; i < 40; i++) {
          
          await runStored(pipe1);
          
        }

        pipe1.name = "bundel2";

        for (i = 0; i < 80; i++) {
        
          await runStored(pipe1);
         
        }

    }).timeout(1000 * 70 * 60);;

    it("Preferred ", async () => {
      let bundel1 = 0;
      let bundel2 = 0;
      const data = generateRandomJson(4);
      pipe1.flowInput.data = data;
      pipe1.name = "bundel1";
      for (j = 0; j < 10; j++) {
        pipe1.name = "bundel1";
        for (i = 0; i < 10; i++) {
          pipe1.tags = [
            `${pipe1.name}${j}`,
            `${pipe1.name}${j}A`,
            `${pipe1.name}${j}B`,
          ];
          await runStored(pipe1);
          bundel1++;
        }
        queueFirst(pipe1.tags[0]);
        pipe1.name = "bundel2";

        for (i = 0; i < 40; i++) {
          pipe1.tags = [
            `${pipe1.name}${j}`,
            `${pipe1.name}${j}C`,
            `${pipe1.name}${j}D`,
          ];
          await runStored(pipe1);
          bundel2++;
          // await delay(3*1000)
        }
        queueFirst(pipe1.tags[0]);
        console.log(`j=${j}`);
        //  await delay(2*1000)
      }

      for (j = 5; j < 7; j++) {
        pipe1.name = "bundel1";
        for (i = 0; i < 10; i++) {
          pipe1.tags = [`${pipe1.name}${j}`];
          await runStored(pipe1);
          bundel1++;
        }
        queueAfterTag(pipe1.tags[0], `${pipe1.name}${j - 1}`);
        console.log(`j=${j}`);
        //  await delay(2*1000)
      }
      pipe1.name = "bundel2";
      for (i = 0; i < 10; i++) {
        pipe1.tags = [`${pipe1.name}-noTag`];
        await runStored(pipe1);
        bundel2++;
      }

      for (j = 8; j < 9; j++) {
        pipe1.name = "bundel2";
        for (i = 0; i < 10; i++) {
          pipe1.tags = [`${pipe1.name}${j}`];
          await runStored(pipe1);
          bundel2++;
        }
        queueLast(pipe1.tags[0]);
        console.log(`j=${j}`);
      }

      // j=3
      //queueDeleteByTag(`bundel16`);
      //queueDeleteByTag(`bundel28`);
      console.log(
        `bundel2 - ${bundel2} , bundel1 - ${bundel1} - total ${
          bundel1 + bundel2
        }`
      );
    }).timeout(1000 * 70 * 60);

    it("run with big flowInput ", async () => {
      //const data = generateRandomJson(4)
      //pipe1.flowInput.data=data;
      pipe1.name = "bundel1";
      for (j = 0; j < 20; j++) {
        pipe1.name = "bundel1";
        for (i = 0; i < 20; i++) {
          pipe1.tags = [`${pipe1.name}${j}`];
          await runStored(pipe1);
        }
        queueFirst(pipe1.tags[0]);
        pipe1.name = "bundel2";

        for (i = 0; i < 20; i++) {
          pipe1.tags = [`${pipe1.name}${j}`];
          await runStored(pipe1);
          // await delay(3*1000)
        }
        queueFirst(pipe1.tags[0]);
        console.log(`j=${j}`);
        //  await delay(2*1000)
      }

      for (j = 5; j < 7; j++) {
        for (i = 0; i < 10; i++) {
          pipe1.tags = [`${pipe1.name}${j}`];
          await runStored(pipe1);
          // await delay(3*1000)
        }
        queueAfterTag(pipe1.tags[0], `${pipe1.name}${j - 1}`);
        console.log(`j=${j}`);
        //  await delay(2*1000)
      }
      for (i = 0; i < 10; i++) {
        pipe1.tags = [`${pipe1.name}-noTag`];
        await runStored(pipe1);
        // await delay(3*1000)
      }

      for (j = 8; j < 9; j++) {
        for (i = 0; i < 10; i++) {
          pipe1.tags = [`${pipe1.name}${j}`];
          await runStored(pipe1);
          // await delay(3*1000)
        }
        queueLast(pipe1.tags[0]);
        console.log(`j=${j}`);
        //  await delay(2*1000)
      }

      j = 3;
      queueDeleteByTag(`${pipe1.name}${j}`);
    }).timeout(1000 * 70 * 60);

    it("run stired ", async () => {
      pipe1.name = "bundel-1";
      for (j = 0; j < 1; j++) {
        pipe1.name = "bundel-1";
        for (i = 0; i < 10; i++) {
          const jnk = await runStored(pipe1);
          // console.log(jnk)
        }
        pipe1.name = "bundel-2";

        for (i = 0; i < 10; i++) {
          await runStored(pipe1);
          // await delay(3*1000)
        }
        await delay(7 * 1000);
      }
    }).timeout(1000 * 70 * 60);

    it("stop", async () => {
      const pipes = [
        "main:bundel-1:ht134bcb",
        "main:bundel-1:el7ysvnh",
        "main:bundel-1:falxdnz5",
        "main:bundel-1:keuh7p4k",
        "main:bundel-1:juv06j1i",
      ];
      for (const pipe of pipes) {
        console.log(pipe);
        stopPipeline(pipe);
      }
    });
  });
  describe("streaming test", () => {
    const bigSring = (size) => {
      let result = "";
      for (var i = 0; i < size; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
      }
      return result;
    };
    var fs = require("fs");

    function getByteArray(filePath) {
      let fileData = fs.readFileSync(filePath).toString("hex");
      let result = [];
      for (var i = 0; i < fileData.length; i += 2)
        result.push("0x" + fileData[i] + "" + fileData[i + 1]);
      return result;
    }

    const Image = getByteArray("test/tests/longTests/chamilion.jpeg");

    function getByteArrayBuffer(filePath) {
      let fileData = fs.readFileSync(filePath);

      return fileData;
    }

    const sendToGateway = async (amount, gateway, rate, data, flow = null) => {
      let url = `https://test.hkube.io/hkube/gateway/${gateway}/streaming/message`;
      if (flow !== null) {
        url = `https://test.hkube.io/hkube/gateway/${gateway}/streaming/message?flow=${flow}`;
      }

      for (i = 0; i < amount; i++) {
        axios.post(url, data);
        await timeout(1 / rate);
      }
    };

    it(" gateway Tikshov big message", async () => {
      const data = generateRandomJson(4);
      data.ping = 0;
      const data1 = generateRandomJson(4);
      const dataSize = JSON.stringify(data).length / 1024;
      console.log(`data size = ${dataSize}`);
      let z = 0;
      let y = 0;
      let intervalId = setInterval(function () {
        sendToGateway(400, "raw-image-gateway", 200, data);
        z += 1;
        console.log(`z=${z}`);
      }, 27 * 1000);

      await delay(50 * 60 * 1000);
      clearInterval(intervalId);
      console.log("end");
      // clearInterval(intervalId2);
    }).timeout(1000 * 70 * 60);

    it(" gateway Tikshov Interval", async () => {
      const data = {
        data: 1,
        data1: 1,
        data2: 1,
        data3: 1,
        data4: 1,
        data5: 1,
        data6: 1,
        data7: 1,
        data8: 1,
        data9: 1,
        data10: 1,
        data11: 1,
      };
      let intervalId = setInterval(function () {
        sendToGateway(200, "raw-image-gateway", 100, data);
        console.log("~~~~~~~~~~~~~~");
      }, 27 * 1000);
    }).timeout(1000 * 60 * 15);

    it(" gateway Tikshov Test", async () => {
      const data = {
        data: 1,
        data1: 1,
        data2: 1,
        data3: 1,
        data4: 1,
        data5: 1,
        data6: 1,
        data7: 1,
        data8: 1,
        data9: 1,
        data10: 1,
        data11: 1,
      };

      for (i = 0; i < 2000; i++) {
        const jnk = axios.post(
          "https://test.hkube.io/hkube/gateway/gateway/streaming/message",
          data
        );
        await timeout(10);
        console.log(i);
      }
    }).timeout(1000 * 60 * 7);

    it("send message to gateway jobid buffer", async () => {
      const file = getByteArrayBuffer("test/tests/longTests/chamilion.jpeg");
      for (i = 0; i < 100; i++) {
        const jnk = await axios.post(
          "https://test.hkube.io/hkube/gateway/images-gateway/streaming/message",
          file,
          {
            headers: { "Content-Type": "application/octet-stream" },
          }
        );
        console.log(i);
      }
    }).timeout(1000 * 60 * 7);

    it("send message to gateway jobid", async () => {
      // https://test.hkube.io/hkube/gateway/images-gateway/streaming/message"

      const url = "hkube/gateway/images-gateway";
      const status = await axios.get(
        `https://test.hkube.io/${url}/streaming/info`
      );

      const data = { test: 1, image: Image }; //['0xff', '0xd8', '0xff', '0xdb', '0x00', '0x84', '0x00', '0x03']

      try {
        let jnk = await axios.post(
          `https://test.hkube.io/${url}/streaming/message`,
          data
        );
      } catch (error) {
        console.log(
          `Error ${error.response.status} - ${error.response.statusText}`
        );
      }

      //console.log("starts loop")
      for (i = 0; i < 1; i++) {
        //    const message = await axios.post(`https://test.hkube.io/${url}/streaming/message`,data)
        // console.log(message.data)
      }

      //console.log("stop")
    }).timeout(1000 * 60 * 7);

    const sendMessage = async (data) => {
      const url = "hkube/gateway/raw-image-gateway";
      const jnk = await axios.post(
        `https://test.hkube.io/${url}/streaming/message`,
        data
      );
      return jnk;
    };
  });
  const monogoQuery = async (query) => {
    const url = `${config.apiServerUrl}/exec/search`;
    const res = await axios.get(url, { params: query });
    return res;
  };

  const getAllJobs = async (id) => {
    const lim = 100;
    let query = { limit: lim, experimentName: "main" }; //"feddd"
    console.log("start query");
    const jnk = await monogoQuery(query);
    console.log(` found - ${jnk.data.hits.length}`);
    expect(jnk.data.hits.length).to.be.equal(lim);
    query.cursor = jnk.data.cursor;
    let i = 1;
    let run = true;
    const start = new Date();
    console.log(`-${start}`);

    while (run) {
      i++;
      let res = await monogoQuery(query);
      query.cursor = res.data.cursor;

      res.data.hits.length < lim ? (run = false) : (run = true);

      console.log(
        `${id} -${i}  ${query.cursor} ${res.data.hits.length} took - ${res.data.timeTook}`
      );
    }

    const end = Date.now();
    console.log(`${id}-${end}`);
    console.log(`${id}-time took ${start - end}`);
    //expect(jnk.data.hits.length).to.be.equal(lim)
  };

  const queryInSec = async (time) => {
    const lim = 100;
    let query = { limit: lim, experimentName: "main" };
    let intervalId = setInterval(function () {
      monogoQuery(query);
    }, 1000);

    await setTimeout(stop_interval, time * 1000);

    function stop_interval() {
      clearInterval(intervalId);
    }
  };
  describe("mongo DB tests", () => {
    it("query load", async () => {
      const lim = 10;
      let query = { limit: lim, experimentName: "main" }; //"feddd"
      console.log("start query");
      const jnk = await monogoQuery(query);

      query.cursor = jnk.data.cursor;

      const jnk1 = await monogoQuery(query);
      console.log(` found - ${jnk.data.hits.length}`);
      expect(jnk.data.hits.length).to.be.equal(lim);
    }).timeout(1000 * 60 * 2);

    it("query load loop", async () => {
      const lim = 100;
      let query = { limit: lim, experimentName: "main" }; //"feddd"
      console.log("start query");
      const jnk = await monogoQuery(query);
      console.log(` found - ${jnk.data.hits.length}`);
      expect(jnk.data.hits.length).to.be.equal(lim);
      query.cursor = jnk.data.cursor;
      let i = 1;
      let run = true;
      const start = new Date();
      console.log(`-${start}`);

      while (run) {
        i++;
        let res = await monogoQuery(query);
        query.cursor = res.data.cursor;

        res.data.hits.length < lim ? (run = false) : (run = true);

        console.log(
          `${i}  ${query.cursor} ${res.data.hits.length} took - ${res.data.timeTook}`
        );
      }

      const end = Date.now();
      console.log(`-${end}`);
      console.log(`time took ${start - end}`);
      //expect(jnk.data.hits.length).to.be.equal(lim)
    }).timeout(1000 * 60 * 2);

    it("multipale requests", async () => {
      let array = [];
      for (i = 0; i < 30; i++) {
        array.push(getAllJobs(i));
      }
      await Promise.all(array);
    }).timeout(1000 * 60 * 60);

    it("multipale same requests", async () => {
      let array = [];
      for (i = 0; i < 100; i++) {
        array.push(queryInSec(300));
      }
      await Promise.all(array);
    }).timeout(1000 * 60 * 60);

    it("", async () => {
      setInterval(() => {
        [...Array(100).keys()].forEach((k) => {
          const lim = 100;
          let query = { limit: lim, experimentName: "main" }; //"feddd"
          monogoQuery(query);
        });
      }, 1000);
    }).timeout(100000);

    describe("lagDriver test", () => {
      const alg = {
        name: "alg-1",
        cpu: 0.1,
        gpu: 0,
        mem: "256Mi",
        reservedMemory: "512Mi",
        minHotWorkers: 0,
        env: "python",
        entryPoint: "mainV4",
        type: "Code",
        options: {
          pending: false,
        },

        algorithmImage: "docker.io/hkubedevtest/alg-1:v9qqnb3n9",
      };

      const creatAlg = async (i) => {
        alg.name = `alg-${i}`;
        const message = await axios.post(
          `https://test.hkube.io/hkube/api-server/api/v1/store/algorithms`,
          alg
        );
        return message;
      };
      it("create 50 alg", async () => {
        for (i = 1; i < 51; i++) {
          const jnk = creatAlg(i);
          console.log(jnk);
        }
      }).timeout(100000);

      const pipe = {
        name: "alg-pipe",
        nodes: [
          {
            nodeName: "alg",
            algorithmName: "alg-1",
            input: ["#[0...300]"],
            kind: "algorithm",
          },
        ],

        options: {
          batchTolerance: 100,
          progressVerbosityLevel: "debug",
          ttl: 3600,
        },
        kind: "batch",
        experimentName: "main",
        priority: 3,
      };

      const runPipe = async (i) => {
        pipe.name = `alg-${i}-pipe`;
        pipe.nodes[0].algorithmName = `alg-${i}`;
        const message = await axios.post(
          `https://test.hkube.io/hkube/api-server/api/v1/exec/raw`,
          pipe
        );
        return message;
      };
      const timeToActivate = 2;
      it("run pipe with alg-i", async () => {
        for (z = 0; z < timeToActivate; z++) {
          for (i = 1; i < 50; i++) {
            const jnk = await runPipe(i);
            //console.log(jnk)
            console.log(`z=${z} , i=${i}`);
          }
          await timeout(1000);
          console.log(`z=${z}`);
        }
      }).timeout(10 * 60 * 1000);

      const deleteAlg = async (i) => {
        const name = `alg-${i}`;
        const message = await axios.delete(
          `https://test.hkube.io/hkube/api-server/api/v1/store/algorithms/${name}`
        );
        return message;
      };

      it("delete ald", async () => {
        for (i = 1; i < 51; i++) {
          const jnk = await deleteAlg(i);
          console.log(jnk);
        }
      }).timeout(100000);

      it("status", async () => {
        for (i = 1; i < 50; i++) {
          console.log(`=============alg-${i}==============`);
          const jnk = await getStatus(1);
          const groupByStatus = groupBy("status");
          const group = groupByStatus(jnk.data);
          for (const [key, value] of Object.entries(group)) {
            console.log(key, value.length);
          }
        }
      }).timeout(100000);

      const getStatus = async (i) => {
        const list = await axios.get(
          `https://test.hkube.io/hkube/api-server/api/v1/pipelines/status?name=alg-${i}-pipe&limit=${timeToActivate}`
        );
        return list;
      };
      function groupBy(key) {
        return function group(array) {
          return array.reduce((acc, obj) => {
            const property = obj[key];
            acc[property] = acc[property] || [];
            acc[property].push(obj);
            return acc;
          }, {});
        };
      }
    });

    describe("autocannon tests", () => {
      /*    to use in command line
        ===============
        autocannon \
        -m POST \
        --body '{"name":"ErickWendel","currency":"BRL","preferences":{"description":"movies"}}' \
        -H "x-app-id: 1"  \
        -c 100 \
        -d 10 \
        http://localhost:3000

    */

      const autocannon = require("autocannon");

      it("send query", async () => {
        let query = { limit: 100, experimentName: "main" };
        const search = `${config.apiServerUrl}/exec/search`;
        // const res = await axios.get(url,{params : query})
        autocannon(
          {
            url: search, //'http://localhost:3000',
            method: "GET",
            connections: 10, //default
            pipelining: 1, // default
            duration: 10, // default
            workers: 4,
            body: `limit :100,experimentName: "main"`,
          },
          console.log
        );

        object_name[`Person_ID_Number_${i}`];
      }).timeout(100000);
    });
  });
});
