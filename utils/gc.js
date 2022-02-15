const chai = require("chai");
const chaiHttp = require("chai-http");
const expect = chai.expect;

chai.use(chaiHttp);
const path = require("path");
const config = require(path.join(process.cwd(), "config/config"));

const execGcClean = async (type, Age = 0) => {
  const descriptor = {
    maxAge: Age,
  };
  const res = await chai
    .request(config.apiServerUrl)
    .post(`/gc/clean/${type}`)
    .send(descriptor);
  return res;
};

const celeanPipeLines = async (Age = 0) => {
  const res = await execGcClean("pipelines", Age);
  return res;
};

module.exports = {
  celeanPipeLines,
};
