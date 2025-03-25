require('dotenv').config()
const { GraphQLClient } = require('graphql-request')
const { WORKERS_ALL_QUERY } = require('../utils/graphql/queries/workers-query');
const JOB_QUERY = require('../utils/graphql/queries/job-query');
const JOB_BY_ID_QUERY = require('../utils/graphql/queries/job-by-id-query');
const ALGORITHM_BY_VERSION_QUERY = require('../utils/graphql/queries/algorithm-by-version-query');
const ERROR_LOG_QUERY = require('../utils/graphql/queries/error-log-query');
const ALL_ALGORITHMS_QUERY = require('../utils/graphql/queries/all-algorithms');
const PIPELINE_DRIVER_QUERY = require('./graphql/queries/pipeline-driver-query');
const delay = require('delay')
// const { setDefaultEncoding } = require('winston-daily-rotate-file');

const Graphql_URL = process.env.BASE_URL + "/hkube/api-server/graphql";

const _createClient = (token) => {
    return new GraphQLClient(Graphql_URL, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

const getDriverIdByJobId = async (token, jobId, experimentName = 'main') => {
    const client = _createClient(token);
    data = await client.request(PIPELINE_DRIVER_QUERY);
    return data.discovery.pipelineDriver.filter((driver) => driver.jobs.some(job => job.jobId === jobId));
};

const getAllAlgorithms = async (token, experimentName = 'main') => {
    const client = _createClient(token);
    const data = await client.request(ALL_ALGORITHMS_QUERY);
    return data.algorithms.list;
};

const getWebSocketlogs = async (token, experimentName = 'main') => {
    const client = _createClient(token);
    const data = await client.request(ERROR_LOG_QUERY);
    return data.errorLogs;
};

const getWebSocketJobs = async (token, experimentName = 'main') => {
    const client = _createClient(token);
    const data = await client.request(JOB_QUERY);
    return data.jobsAggregated.jobs
};

const getJobById = async (token, jobId) => {
    const client = _createClient(token);
    const variables = {
        jobId
    }
    const data = await client.request(JOB_BY_ID_QUERY,variables);
    return data;
};

const getJobsByNameAndVersion = async (token, name,version) => {
    const client = _createClient(token);
    const variables = {
        name,
        version
    }
    const data = await client.request(ALGORITHM_BY_VERSION_QUERY,variables);
    return data;
};

const getWorkers = async (token, experimentName = 'main') => { // WORK ADIR
    const client = _createClient(token);
    return await client.request(WORKERS_ALL_QUERY);
};

const waitForWorkers = async (token, algName, count, waitCycles = 10) => {
    let workers = [];
    for (let i = 0; i < waitCycles; i++) {
        const data = await getWorkers(token)
        workers = data.discovery.worker.filter(worker => worker.algorithmName == algName);
        if (workers.length == count) {
            return workers;
        }
        await delay(3000)
    }
    return workers;
}

module.exports = {
    getWorkers,
    getWebSocketJobs,
    getWebSocketlogs,
    getDriverIdByJobId,
    waitForWorkers,
    getJobById,
    getJobsByNameAndVersion,
    getAllAlgorithms
}
