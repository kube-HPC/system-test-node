const delay = require('delay');
const chai = require('chai');
const expect = chai.expect;

const {
    getRawGraph
} = require('../utils/results');

/**
 * Waits for a specific status of a node in a job graph, polling at intervals, until a timeout is reached.
 * 
 * @param {string} jobId - The ID of the job whose graph is being monitored.
 * @param {string} nodeName - The name of the node to monitor for the expected status.
 * @param {string} expectedStatus - The status value to wait for (e.g., 'active', 'completed').
 * @param {number} [timeout=600000] - Optional. The maximum time to wait for the status in milliseconds (default is 10 minutes).
 * @param {number} [interval=5000] - Optional. The polling interval in milliseconds (default is 5 seconds).
 * 
 * @returns {Promise<number>} Resolves to the time in milliseconds that was taken to achieve the expected status before the timeout.
 * If the expected status is not achieved within the timeout, it throws an error.
 * 
 * @throws Will throw an error if the expected status is not achieved within the timeout.
 */
const waitForStatus = async (jobId, nodeName, expectedStatus, timeout = 60 * 1000 * 10, interval = 5 * 1000) => {
    const start = Date.now();
    do {
        process.stdout.write(`\rWaiting for ${nodeName} status to be ${expectedStatus}, Time passed: ${Date.now() - start}/${timeout} ms...`)
        let { body: graph } = await getRawGraph(jobId);
        const filtered = graph.nodes.filter(node => node.nodeName === nodeName);
        if (filtered.length > 0) {
            const node = filtered[0];
            if (node.batch) {
                const activeTask = node.batch.filter((task) => task.status === expectedStatus);
                if (activeTask.length > 0) {
                    console.log(`\n${nodeName} is ${expectedStatus}`);
                    return Date.now() - start;
                }
            }
            else if (node.status === expectedStatus) {
                console.log(`\n${nodeName} is ${expectedStatus}`);
                return Date.now() - start;
            }
        }
        await delay(interval);
    } while (Date.now() - start < timeout);
    expect.fail(`\ntimeout exceeded trying to get ${expectedStatus} status in result for node ${nodeName}`);
}

/**
 * Retrieves the number of active pods for a specific node in a job graph.
 * 
 * @param {object} graph - The job graph containing nodes and edges.
 * @param {string} nodeName - The name of the node to check for active pods.
 * 
 * @returns {number} The number of active pods for the specified node.
 */
const getNumActivePods = (graph, nodeName) => {
    const filtered = graph.nodes.filter(node => node.nodeName === nodeName);
    if (filtered.length > 0) {
        const node = filtered[0];
        if (node.batch) {
            return node.batch.filter(task => task.status === 'active').length;
        } else if (node.status === 'active') {
            return 1;
        }
    }
    return 0;
}

/**
 * Retrieves the request rate between two nodes in a job graph.
 * 
 * @param {string} jobId - The ID of the job whose graph is being queried.
 * @param {string} source - The source node.
 * @param {string} target - The target node.
 * 
 * @returns {Promise<number>} The request rate between the source and target nodes.
 */
const getRequestRate = async (jobId, source, target) => {

    let { body: graph } = await getRawGraph(jobId);
    const filtered = graph.edges.filter(edge => edge.from === source && edge.to === target);
    const metrics = filtered[0]?.value['metrics'];
    return metrics.reqRate;
}

/**
 * Retrieves the current number of pods between two nodes in a job graph.
 * 
 * @param {string} jobId - The ID of the job whose graph is being queried.
 * @param {string} source - The source node.
 * @param {string} target - The target node.
 * 
 * @returns {Promise<number>} The current number of pods between the source and target nodes.
 */
const getCurrentPods = async (jobId, source, target) => {
    let { body: graph } = await getRawGraph(jobId);
    const filtered = graph.edges.filter(edge => edge.from === source && edge.to === target);
    const metrics = filtered[0]?.value['metrics'];
    return metrics.currentSize;
}

/**
 * Retrieves the response rate between two nodes in a job graph.
 * 
 * @param {string} jobId - The ID of the job whose graph is being queried.
 * @param {string} source - The source node.
 * @param {string} target - The target node.
 * 
 * @returns {Promise<number>} The response rate between the source and target nodes.
 */
const getResponseRate = async (jobId, source, target) => {
    let { body: graph } = await getRawGraph(jobId);
    const filtered = graph.edges.filter(edge => edge.from === source && edge.to === target);
    const metrics = filtered[0]?.value['metrics'];
    return metrics.resRate;
}

/**
 * Retrieves the required number of pods between two nodes in a job graph.
 * 
 * @param {string} jobId - The ID of the job whose graph is being queried.
 * @param {string} source - The source node.
 * @param {string} target - The target node.
 * 
 * @returns {Promise<number>} The required number of pods between the source and target nodes.
 */
const getRequiredPods = async (jobId, source, target) => {
    let { body: graph } = await getRawGraph(jobId);
    const filtered = graph.edges.filter(edge => edge.from === source && edge.to === target);
    const metrics = filtered[0]?.value['metrics'];
    return metrics.required;
}

/**
 * Retrieves the throughput between two nodes in a job graph.
 * 
 * @param {string} jobId - The ID of the job whose graph is being queried.
 * @param {string} source - The source node.
 * @param {string} target - The target node.
 * 
 * @returns {Promise<number>} The throughput between the source and target nodes, in percentage.
 */
const getThroughput = async (jobId, source, target) => {
    let { body: graph } = await getRawGraph(jobId);
    const filtered = graph.edges.filter(edge => edge.from === source && edge.to === target);
    const metrics = filtered[0]?.value['metrics'];
    return metrics.throughput;
}

/**
 * Creates a flowInput object based on the provided values object.
 * If any values are not provided, default values are used for optional fields,
 * but 'rate' and 'time' are required.
 *
 * @param {Object} values - An object containing the flow values.
 * @param {string} [values.flowName="hkube_desc"] - The name of the flow.
 * @param {number} [values.processTime=0.02] - The process_time value.
 * @param {Array} values.programs - Array of program objects with required rate and time, and optional size.
 * @returns {Object} The flowInput object structured with the given values.
 * @throws Will fail the test if 'rate' or 'time' is not provided in any program object.
 */
const createFlowInput = (values = {}) => {
    const {
        flowName = "hkube_desc",
        processTime = 0.02,
        programs = []
    } = values;

    const invalidPrograms = programs.filter(program => program.rate === undefined || program.time === undefined);
    
    if (invalidPrograms.length > 0) {
        expect.fail(`\nMissing required fields in programs: ${JSON.stringify(invalidPrograms)}`);
    }

    return {
        "flows": [
            {
                "name": flowName,
                "program": programs.map(program => ({
                    "rate": program.rate || 120, // rate of request per second
                    "time": program.time || 50, // for how long this rate will continue
                    "size": program.size || 80 // size of each message
                }))
            }
        ],
        "process_time": processTime // process time per message
    };
};


module.exports = {
    waitForStatus,
    getNumActivePods,
    getRequestRate,
    getCurrentPods,
    getResponseRate,
    getRequiredPods,
    getThroughput,
    createFlowInput
}
