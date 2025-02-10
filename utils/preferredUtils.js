const chai = require("chai");
const chaiHttp = require("chai-http");

chai.use(chaiHttp);
const path = require("path");
const config = require(path.join(process.cwd(), "config/config"));

const queuePreferred = async (body) => {
  res = await chai
    .request(config.apiServerUrl)
    .post(`/queue/preferred`)
    .send(body);
  return res;
};

const deletePreferred = async (body) => {
  res = await chai
    .request(config.apiServerUrl)
    .post(`/queue/preferred/deletes`)
    .send(body);
  return res;
};

const getAllManagedJobs = async ( size = 100) => {
  let jobs = [];
  res = await chai
    .request(config.apiServerUrl)
    .get(`/queue/managed/?pageSize=${size}`);

  res.body.returnList.forEach((e) => jobs.push(e.jobId));

  return jobs;
};

const getAllPreferredJobs = async ( size = 100) => {
  let jobs = [];
  res = await chai
    .request(config.apiServerUrl)
    .get(`/queue/preferred/?pageSize=${size}`);

  res.body.returnList.forEach((e) => jobs.push(e.jobId));

  return jobs;
};

const getJobsByTag = async (tagName, size = 100) => {
  let jobs = [];
  res = await chai
    .request(config.apiServerUrl)
    .get(`/queue/managed/?pageSize=${size}&tag=${tagName}`);

  res.body.returnList.forEach((e) => jobs.push(e.jobId));

  return jobs;
};

const getJobsFromPreferredByTag = async (tagName, size = 100) => {
  let jobs = [];
  res = await chai
    .request(config.apiServerUrl)
    .get(`/queue/preferred?pageSize=${size}&tag=${tagName}`);

  res.body.returnList.forEach((e) => jobs.push(e.jobId));
  console.log(`getJobsFromPreferredByTag jobs size = ${jobs.length}`);
  return jobs;
};

const queueFirst = async (tagName) => {
  const body = {
    jobs: [],
    position: "first"
  };

  jobs = await getJobsByTag(tagName);

  body.jobs = jobs;
  console.log(`in ${tagName} found the following jod : ${jobs}`);
  const res = await queuePreferred(body);
  return res;
};

const queueDeleteByTag = async (tagName) => {
  const body = {
    jobs: []
  };

  jobs = await getJobsFromPreferredByTag(tagName);

  body.jobs = jobs;
  console.log(`in ${tagName} found the following jod : ${jobs}`);
  const res = await deletePreferred(body);
  return res;
};

const queueLast = async (tagName) => {
  const body = {
    jobs: [],
    position: "last"
  };

  jobs = await getJobsByTag(tagName);

  body.jobs = jobs;
  console.log(`in ${tagName} found the following jod : ${jobs}`);
  const res = await queuePreferred(body);
  return res;
};

const queueAfterTag = async (tagName,afterTag) => {
  const body = {
    jobs: [],
    position: "after",
    query: {
      tag: afterTag}
  };

  jobs = await getJobsByTag(tagName);

  body.jobs = jobs;
  console.log(`in ${tagName} found the following jod : ${jobs}`);
  const res = await queuePreferred(body);
  return res;
};

module.exports = {
  getAllManagedJobs,
  getAllPreferredJobs,
  queueFirst,
  queueAfterTag,
  queueLast,
  queueDeleteByTag,
  deletePreferred
};
