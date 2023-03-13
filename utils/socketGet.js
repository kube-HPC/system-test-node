require('dotenv').config()
const { request } = require('graphql-request')
const { WORKERS_ALL_QUERY } = require('../utils/graphql/queries/workers-query');
const JOB_QUERY = require('../utils/graphql/queries/job-query');
const JOB_BY_ID_QUERY = require('../utils/graphql/queries/job-by-id-query');
const ALGORITHM_BY_VERSION_QUERY = require('../utils/graphql/queries/algorithm-by-version-query');
const ERROR_LOG_QUERY = require('../utils/graphql/queries/error-log-query');
const PIPELINE_DRIVER_QUERY = require('./graphql/queries/pipeline-driver-query');
const delay = require('delay')
const { setDefaultEncoding } = require('winston-daily-rotate-file');

const Graphql_URL = process.env.BASE_URL + "/hkube/api-server/graphql";


const getDriverIdByJobId = async (jobId, experimentName = 'main') => {
    data = await request(Graphql_URL, PIPELINE_DRIVER_QUERY);
    return data.discovery.pipelineDriver.filter((driver) => driver.jobs.some(job => job.jobId === jobId));
}


const getWebSocketlogs = async (experimentName = 'main') => {
    const data = await request(Graphql_URL, ERROR_LOG_QUERY);
    return data.errorLogs;
}

const getWebSocketJobs = async (experimentName = 'main') => {
    const data = await request(Graphql_URL, JOB_QUERY);
    return data.jobsAggregated.jobs
};
const getJobById = async (jobId) => {
    const variables = {
        jobId
    }
    const data = await request(Graphql_URL, JOB_BY_ID_QUERY,variables);
    return data;
};

const getJobsByNameAndVersion = async (name,version) => {
    const variables = {
        name,
        version
    }
    const data = await request(Graphql_URL, ALGORITHM_BY_VERSION_QUERY,variables);
    return data;
};



const getWorkers = async (experimentName = 'main') => {

    return await request(Graphql_URL, WORKERS_ALL_QUERY);
}

const waitForWorkers = async (algName, count, waitCycles = 10) => {
    let found = false;
    let workers = [];
    for (let i = 0; i < waitCycles; i++) {
        const data = await getWorkers()
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
    getJobsByNameAndVersion
}