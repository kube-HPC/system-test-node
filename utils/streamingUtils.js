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
     * @returns {Promise<boolean>} Resolves to `true` if the expected status is found before timeout, otherwise fails the test.
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
                    console.log();
                    return true;
                }
            }
            else if (node.status === expectedStatus) {
                console.log();
                return true;
            }
        }
        await delay(interval);
    } while (Date.now() - start < timeout);
    expect.fail(`timeout exceeded trying to get ${expectedStatus} status in result for node ${nodeName}`);
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

module.exports = {
    waitForStatus,
    getNumActivePods,
    getRequestRate,
    getCurrentPods,
    getResponseRate,
    getRequiredPods,
    getThroughput
}
