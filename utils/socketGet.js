require('dotenv').config()
const { request } = require('graphql-request')
const { WORKERS_ALL_QUERY } = require('../utils/graphql/queries/workers-query');
const { JOB_QUERY } = require('../utils/graphql/queries/job-query');
const { ERROR_LOG_QUERY } = require('../utils/graphql/queries/error-log-query');
const { PIPELINE_DRIVER_QUERY } = require('./graphql/queries/pipeline-driver-query');

const { setDefaultEncoding } = require('winston-daily-rotate-file');

const Graphql_URL = process.env.BASE_URL + "/hkube/api-server/graphql";


const getDriverIdByJobId = async (jobId, experimentName = 'main') => {

    await request(Graphql_URL, PIPELINE_DRIVER_QUERY).then((data) => {

        return data.discovery.pipelineDriver.filter((driver) => driver.jobs.some(job => job.jobId === jobId))

    });

}


const getWebSocketlogs = async (experimentName = 'main') => {

    await request(Graphql_URL, ERROR_LOG_QUERY).then((data) => {
        return data.errorLogs
    });

}

const getWebSocketJobs = async (experimentName = 'main') => {

    await request(Graphql_URL, JOB_QUERY).then((data) => {
        return data.jobsAggregated.jobs
    });

}



const getWebSocketData = async (experimentName = 'main') => {

    return await request(Graphql_URL, WORKERS_ALL_QUERY);
}


module.exports = {
    getWebSocketData,
    getWebSocketJobs,
    getWebSocketlogs,
    getDriverIdByJobId
}