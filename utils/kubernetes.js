const EventEmitter = require('events');
const Logger = require('@hkube/logger');
const kubernetesClient = require('kubernetes-client');
const objectPath = require('object-path');
const { components, containers } = require('../consts');
const component = components.K8S;
const CONTAINERS = containers;
let log;

class KubernetesApi extends EventEmitter {
    async init(options = {}) {
        const k8sOptions = options.kubernetes || {};
        log = Logger.GetLogFromContainer();
        let config;
        if (!k8sOptions.isLocal) {
            try {
                config = kubernetesClient.config.fromKubeconfig();
            }
            catch (error) {
                log.error(`Error initializing kubernetes. error: ${error.message}`, { component }, error);
                return;
            }
        }
        else {
            config = kubernetesClient.config.getInCluster();
        }
        log.info(`Initialized kubernetes client with options ${JSON.stringify({ options: options.kubernetes, url: config.url })}`, { component });
        this._client = new kubernetesClient.Client({ config, version: '1.9' });
        this._namespace = k8sOptions.namespace;
    }

    async createJob({ spec, jobDetails = {} }) {
        log.info(`Creating job ${spec.metadata.name} ${jobDetails.hotWorker ? '[hot-worker]' : ''}`, { component });
        try {
            const res = await this._client.apis.batch.v1.namespaces(this._namespace).jobs.post({ body: spec });
            return res;
        }
        catch (error) {
            log.error(`unable to create job ${spec.metadata.name}. error: ${error.message}`, { component }, error);
        }
        return null;
    }

    async deleteJob(jobName) {
        log.info(`Deleting job ${jobName}`, { component });
        try {
            const res = await this._client.apis.batch.v1.namespaces(this._namespace).jobs(jobName).delete();
            return res;
        }
        catch (error) {
            log.error(`unable to delete job ${jobName}. error: ${error.message}`, { component }, error);
        }
        return null;
    }

    async getWorkerJobs() {
        const jobsRaw = await this._client.apis.batch.v1.namespaces(this._namespace).jobs().get({ qs: { labelSelector: `type=${CONTAINERS.WORKER},group=hkube` } });
        return jobsRaw;
    }

    async getPipelineDriversJobs() {
        const jobsRaw = await this._client.apis.batch.v1.namespaces(this._namespace).jobs().get({ qs: { labelSelector: `type=${CONTAINERS.PIPELINE_DRIVER},group=hkube` } });
        return jobsRaw;
    }

    async getPodsForJob(job) {
        if (!job) {
            return [];
        }
        const podSelector = objectPath.get(job, 'spec.selector.matchLabels');
        if (!podSelector) {
            return [];
        }
        const pods = await this._client.api.v1.namespaces(this._namespace).pods().get({ qs: { labelSelector: podSelector } });
        return pods;
    }

    async getVersionsConfigMap() {
        try {
            const configMap = await this._client.api.v1.namespaces(this._namespace).configmaps('hkube-versions').get();
            const versions = JSON.parse(configMap.body.data['versions.json']);
            const registry = configMap.body.data['registry.json'] && JSON.parse(configMap.body.data['registry.json']);
            const clusterOptions = configMap.body.data['clusterOptions.json'] && JSON.parse(configMap.body.data['clusterOptions.json']);
            return { versions, registry, clusterOptions };
        }
        catch (error) {
            log.error(`unable to get configmap. error: ${error.message}`, { component }, error);
            return {};
        }
    }

    async getResourcesPerNode() {
        const [pods, nodes] = await Promise.all([this._client.api.v1.pods.get(), this._client.api.v1.nodes.get()]);
        return { pods, nodes };
    }
}

module.exports = new KubernetesApi();
module.exports.KubernetesApi = KubernetesApi;