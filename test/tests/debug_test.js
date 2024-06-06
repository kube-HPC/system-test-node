// const { assert } = require("chai");
// //const ws = require("../../utils/ws");
// const NodejsWrapper = require("@hkube/nodejs-wrapper");
// const delay = require("delay");

// describe("debug api tests", () => {
//   // it("jnk debug", async () => {
//   //   function _sendCommand({ command, data }) {
//   //     try {
//   //       miws.send({ command, data });
//   //     } catch (error) {
//   //       //this._sendError(error);
//   //       console.log("error sending");
//   //     }
//   //   }
//   //   let debug = false;
//   //   url = "ws://cicd-test.hkube.org/hkube/debug/yellow-alg";
//   //   const miws = new ws({ socket: { encoding: "msgpack", url } });

//   //   miws.on("start", (message) => {
//   //     debug = true;
//   //     _sendCommand({ command: "done", data: 41414141 }); //messages.outgoing.done
//   //   });

//   //   while (!debug) {
//   //     const timeout = await delay(1000 * 3);
//   //     console.log("jnk");
//   //   }

//   //   assert(debug);
//   // });

//   const alg = async (args, hkubeApi) => {
//     input = args.input[0];
//     console.log(`started and input = ${input}`);
//     return input + 42;
//   };
//   it("debug js ", async () => {
//     url = "ws://cicd-test.hkube.org/hkube/debug/yellow-alg";
//     console.log(`starting debug on url ${url}`);
//     await NodejsWrapper.debug(url, alg);
//   });
// });
