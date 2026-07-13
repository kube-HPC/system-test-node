const path = require('path');
const net = require('net');
const { URL } = require('url');
const delay = require('delay');
const config = require(path.join(process.cwd(), 'config/config'));
const { client, filterPodsByName } = require('./kubeCtl');
const { write_log } = require('./misc_utils');

// api-server runs as a DaemonSet (one pod per node). All pods share the same name prefix.
const API_SERVER_POD_PREFIX = process.env.API_SERVER_POD_PREFIX || 'api-server';
// REST port the api-server listens on inside the pod (helm: api_server.env.port).
const API_SERVER_PORT = process.env.API_SERVER_PORT || 3000;
const DEFAULT_NAMESPACE = process.env.NAMESPACE || 'default';

/**
 * Return the list of Running api-server pods (full pod objects).
 * Pods that are terminating (deletionTimestamp set) or not yet Running are filtered out.
 */
const getApiServerPods = async (namespace = DEFAULT_NAMESPACE) => {
    const pods = await filterPodsByName(API_SERVER_POD_PREFIX, namespace);
    if (!pods) {
        return [];
    }
    return pods.filter(p => p.status
        && p.status.phase === 'Running'
        && !(p.metadata && p.metadata.deletionTimestamp));
};

/**
 * Return only the names of the Running api-server pods.
 */
const getApiServerPodNames = async (namespace = DEFAULT_NAMESPACE) => {
    const pods = await getApiServerPods(namespace);
    return pods.map(p => p.metadata.name);
};

/**
 * Query a single api-server pod for its leader-election status.
 *
 * The `/internal/v1/leader` route is blocked from the public ingress, so we reach it through
 * the Kubernetes pod-proxy. The proxied request hits the pod at path `/internal/v1/leader`
 * (without the `/hkube/api-server` ingress prefix), which is not blocked.
 *
 * @returns {Promise<{current: string, etcdLeader: string, redisLeader: string, instances: Array<{instanceId: string, isLeader: boolean}>}>}
 */
const getPodLeaderInfo = async (podName, namespace = DEFAULT_NAMESPACE) => {
    const pathname = `/api/v1/namespaces/${namespace}/pods/${podName}:${API_SERVER_PORT}/proxy/internal/v1/leader`;
    const res = await client.backend.http({ method: 'GET', pathname, json: true });
    return res.body;
};

/**
 * Build a cluster-wide leadership view by asking every Running api-server pod which instanceId
 * it is. The leader is identified by the redis lock owner (`redisLeader`) - the election source
 * of truth - matched back to the pod that reports that instanceId as its own (`current`).
 *
 * @returns {Promise<{
 *   pods: Array<{podName: string, instanceId: string|null, isLeader: boolean, error?: string}>,
 *   instances: Array<{instanceId: string, isLeader: boolean}>,
 *   redisLeader: string|null,
 *   etcdLeader: string|null,
 *   leaderInstanceId: string|null,
 *   leaderPodName: string|null,
 *   reachablePods: number
 * }>}
 */
const getLeadership = async (namespace = DEFAULT_NAMESPACE) => {
    const podNames = await getApiServerPodNames(namespace);
    const pods = [];
    let redisLeader = null;
    let etcdLeader = null;
    let instances = [];

    for (const podName of podNames) {
        try {
            // eslint-disable-next-line no-await-in-loop
            const info = await getPodLeaderInfo(podName, namespace);
            redisLeader = info.redisLeader || redisLeader;
            etcdLeader = info.etcdLeader || etcdLeader;
            if (Array.isArray(info.instances) && info.instances.length >= instances.length) {
                instances = info.instances;
            }
            // The redis lock owner is the election source of truth. Prefer it over the etcd
            // discovery self-record, which is updated fire-and-forget and can briefly lag right
            // after a failover. Fall back to the etcd flag only when redis reports no owner.
            const self = (info.instances || []).find(i => i.instanceId === info.current);
            const isLeader = info.redisLeader
                ? info.current === info.redisLeader
                : (self ? self.isLeader === true : false);
            pods.push({ podName, instanceId: info.current, isLeader });
        }
        catch (error) {
            write_log(`failed to query leader info from pod ${podName}: ${error.message}`, 'warn');
            pods.push({ podName, instanceId: null, isLeader: false, error: error.message });
        }
    }

    const reachablePods = pods.filter(p => p.instanceId).length;
    const leaderByRedis = redisLeader && pods.find(p => p.instanceId && p.instanceId === redisLeader);
    const leaderByFlag = pods.find(p => p.isLeader);
    const leaderPod = leaderByRedis || leaderByFlag || null;

    return {
        pods,
        instances,
        redisLeader,
        etcdLeader,
        leaderInstanceId: redisLeader || (leaderPod && leaderPod.instanceId) || null,
        leaderPodName: leaderPod ? leaderPod.podName : null,
        reachablePods
    };
};

/**
 * Return the pod name of the current leader, or null when no leader is reachable.
 */
const getLeaderPodName = async (namespace = DEFAULT_NAMESPACE) => {
    const { leaderPodName } = await getLeadership(namespace);
    return leaderPodName;
};

/**
 * Poll until a single leader is elected and its pod is reachable.
 * Returns the full leadership view once a leader is found, otherwise the last view seen.
 */
const waitForLeader = async (timeout = 60 * 1000, interval = 3 * 1000, namespace = DEFAULT_NAMESPACE) => {
    const start = Date.now();
    let leadership;
    do {
        // eslint-disable-next-line no-await-in-loop
        leadership = await getLeadership(namespace);
        if (leadership.leaderPodName && leadership.leaderInstanceId) {
            return leadership;
        }
        write_log(`waiting for a leader to be elected (${Date.now() - start}/${timeout} ms)`);
        // eslint-disable-next-line no-await-in-loop
        await delay(interval);
    } while (Date.now() - start < timeout);
    return leadership;
};

/**
 * Poll until leadership moves away from `previousLeaderInstanceId` to a new, reachable leader.
 * Used after killing the leader pod to assert that failover elected a different instance.
 */
const waitForLeaderChange = async (previousLeaderInstanceId, timeout = 60 * 1000, interval = 3 * 1000, namespace = DEFAULT_NAMESPACE) => {
    const start = Date.now();
    let leadership;
    do {
        // eslint-disable-next-line no-await-in-loop
        leadership = await getLeadership(namespace);
        if (leadership.leaderInstanceId
            && leadership.leaderInstanceId !== previousLeaderInstanceId
            && leadership.leaderPodName) {
            return leadership;
        }
        write_log(`waiting for leader to change from ${previousLeaderInstanceId} (${Date.now() - start}/${timeout} ms)`);
        // eslint-disable-next-line no-await-in-loop
        await delay(interval);
    } while (Date.now() - start < timeout);
    return leadership;
};

/**
 * Poll until the number of Running api-server pods reaches `expectedCount` (e.g. after a killed
 * DaemonSet pod is recreated).
 */
const waitForApiServerPods = async (expectedCount, timeout = 90 * 1000, interval = 5 * 1000, namespace = DEFAULT_NAMESPACE) => {
    const start = Date.now();
    let podNames;
    do {
        // eslint-disable-next-line no-await-in-loop
        podNames = await getApiServerPodNames(namespace);
        if (podNames.length >= expectedCount) {
            return podNames;
        }
        write_log(`waiting for ${expectedCount} api-server pods, currently ${podNames.length} (${Date.now() - start}/${timeout} ms)`);
        // eslint-disable-next-line no-await-in-loop
        await delay(interval);
    } while (Date.now() - start < timeout);
    return podNames;
};

/**
 * TCP reachability check for a URL's host:port. The webhook exactly-once tests depend on an
 * external collector (config.webhookUrl) that must be reachable from BOTH the cluster pods and
 * this test runner; when it is down we skip those tests instead of failing with a confusing
 * connect ETIMEDOUT that looks like a product bug.
 */
const isHostReachable = (urlString, timeout = 5 * 1000) => {
    return new Promise((resolve) => {
        if (!urlString) {
            resolve(false);
            return;
        }
        let url;
        try {
            url = new URL(urlString);
        }
        catch (error) {
            resolve(false);
            return;
        }
        const port = url.port || (url.protocol === 'https:' ? 443 : 80);
        const socket = new net.Socket();
        let done = false;
        const finish = (ok) => {
            if (done) {
                return;
            }
            done = true;
            socket.destroy();
            resolve(ok);
        };
        socket.setTimeout(timeout);
        socket.once('connect', () => finish(true));
        socket.once('timeout', () => finish(false));
        socket.once('error', () => finish(false));
        socket.connect(port, url.hostname);
    });
};

/**
 * Whether the configured webhook collector (WEBHOOK_URL) is reachable right now.
 */
const isWebhookReachable = (timeout = 5 * 1000) => isHostReachable(config.webhookUrl, timeout);

module.exports = {
    API_SERVER_POD_PREFIX,
    API_SERVER_PORT,
    getApiServerPods,
    getApiServerPodNames,
    getPodLeaderInfo,
    getLeadership,
    getLeaderPodName,
    waitForLeader,
    waitForLeaderChange,
    waitForApiServerPods,
    isHostReachable,
    isWebhookReachable,
    webhookResultUrl: config.webhookUrl ? `${config.webhookUrl}/results` : null
};
