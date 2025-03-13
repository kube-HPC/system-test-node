const chai = require("chai");
const chaiHttp = require("chai-http");
const expect = chai.expect;

chai.use(chaiHttp);
const path = require("path");
const config = require(path.join(process.cwd(), "config/config"));

const execGcClean = async (type, token = {}, Age = 0) => {
  const descriptor = {
    maxAge: Age,
  };
  const res = await chai
    .request(config.apiServerUrl)
    .post(`/gc/clean/${type}`)
    .set("Authorization", `Bearer ${token}`)
    .send(descriptor);
  return res;
};

const cleanPipeLines = async (token = {}, Age = 0) => {
  const res = await execGcClean("pipelines", token, Age);
  return res;
};

module.exports = {
  cleanPipeLines,
};
