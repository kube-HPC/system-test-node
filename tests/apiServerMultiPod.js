const chai = require('chai');
const chaiHttp = require('chai-http');
const delay = require('delay');
const path = require('path');

const expect = chai.expect;
chai.use(chaiHttp);

const config = require(path.join(process.cwd(), 'config/config'));

const {
    loginWithRetry,
    write_log,
    checkEqualWithRetries
} = require('../utils/misc_utils');

const {
    getApiServerPods,
    getApiServerPodNames,
    getLeadership,
    waitForLeader,
    waitForLeaderChange,
    waitForApiServerPods,
    isWebhookReachable,
    webhookResultUrl
} = require('../utils/apiServerUtils');

const {
    deletePod,
    getNodes
} = require('../utils/kubeCtl');

const {
    runRaw,
    getPipeline,
    deletePipeline,
    storePipelinesWithDescriptor
} = require('../utils/pipelineUtils');

const {
    getResult,
    getJobIdStatus
} = require('../utils/results');

const {
    getResults
} = require('../utils/webhook');

// Election timing (api-server config.base.js): lockTtl 2500ms, renewInterval 1000ms,
// backupInterval 5000ms, jitter 250ms. A new leader appears within a few seconds of the old
// one disappearing; we poll well beyond that to stay robust on a busy cluster.
const FAILOVER_TIMEOUT = 60 * 1000;
const POD_RECOVERY_TIMEOUT = 2 * 60 * 1000;
// Time to wait after the first webhook delivery to make sure NO duplicate (one per non-leader
// pod) arrives late. Must comfortably exceed the webhook retry/dispatch window.
const DUPLICATE_WEBHOOK_GRACE = 15 * 1000;

// Build a single-task eval-alg pipeline (same shape as pipelines/evalwait.js): the batch
// operator '#@flowInput.inputs' expands [[sleepMs, value]] into one task whose code sleeps
// sleepMs and resolves value + 6.
const buildEvalPipeline = ({ name, sleepMs, withWebhook }) => {
    const pipeline = {
        name,
        nodes: [
            {
                nodeName: 'evalsleep',
                algorithmName: 'eval-alg',
                input: ['#@flowInput.inputs'],
                extraData: {
                    code: [
                        '(input,require)=> {',
                        'const promise = new Promise((resolve)=>{setTimeout(()=>resolve(input[0][1]),input[0][0])});',
                        'return promise.then(value => value + 6);',
                        '}'
                    ]
                }
            }
        ],
        flowInput: {
            inputs: [[sleepMs, 1]]
        }
    };
    if (withWebhook && webhookResultUrl) {
        pipeline.webhooks = { result: webhookResultUrl };
    }
    return pipeline;
};

describe('TID-162- Multiple api-server pods (DaemonSet) validation', () => {
    let token;
    let podCount = 0;
    let nodeCount = 0;
    let webhookReachable = false;
    const createdPipelines = [];

    before(async function () {
        this.timeout(5 * 60 * 1000);
        token = await loginWithRetry();
        const pods = await getApiServerPods();
        podCount = pods.length;
        try {
            nodeCount = (await getNodes()).length;
        }
        catch (error) {
            write_log(`could not read cluster nodes: ${error.message}`, 'warn');
        }
        write_log(`api-server running pods: ${podCount} [${pods.map(p => p.metadata.name).join(', ')}], cluster nodes: ${nodeCount}`);
        if (podCount < 2) {
            write_log('WARNING: fewer than 2 api-server pods found - multi-pod and failover tests will be skipped. Verify the DaemonSet rolled out on all nodes.', 'warn');
        }
        // The webhook exactly-once tests rely on an external collector (WEBHOOK_URL) that must be
        // reachable from both the cluster pods and this runner. Probe it up front so we can skip
        // (rather than fail with connect ETIMEDOUT) when the collector is down.
        if (webhookResultUrl) {
            webhookReachable = await isWebhookReachable();
            if (!webhookReachable) {
                write_log(`WARNING: webhook collector ${config.webhookUrl} is unreachable - webhook exactly-once tests will be skipped. Start the collector to validate singleton webhook delivery.`, 'warn');
            }
        }
        else {
            write_log('WARNING: WEBHOOK_URL is not configured - webhook exactly-once tests will be skipped.', 'warn');
        }
    });

    after(async function () {
        this.timeout(2 * 60 * 1000);
        for (const name of createdPipelines) {
            try {
                // eslint-disable-next-line no-await-in-loop
                await deletePipeline(name, token);
            }
            catch (error) {
                write_log(`failed to delete pipeline ${name}: ${error.message}`, 'warn');
            }
        }
    });

    // Poll the external webhook server until at least `min` result deliveries are recorded for
    // the job, returning the deliveries seen.
    const waitForWebhookResults = async (jobId, min = 1, timeout = 60 * 1000, interval = 3 * 1000) => {
        const start = Date.now();
        let data = [];
        do {
            const res = await getResults(jobId);
            data = (res.body && res.body.data) || [];
            if (data.length >= min) {
                return data;
            }
            await delay(interval);
        } while (Date.now() - start < timeout);
        return data;
    };

    const countWebhookResults = async (jobId) => {
        const res = await getResults(jobId);
        return (res.body && res.body.data) ? res.body.data.length : 0;
    };

    const waitUntilJobStarted = async (jobId, timeout = 60 * 1000, interval = 2 * 1000) => {
        const start = Date.now();
        do {
            const res = await getJobIdStatus(jobId, token);
            const status = res.body && res.body.status;
            if (status && status !== 'pending') {
                write_log(`job ${jobId} reached status: ${status}`);
                return status;
            }
            await delay(interval);
        } while (Date.now() - start < timeout);
        return null;
    };

    describe('topology & registration', () => {
        it('TID-162.1 api-server is deployed as a DaemonSet with multiple pods', async function () {
            this.timeout(60 * 1000);
            const pods = await getApiServerPods();
            expect(pods.length, 'no Running api-server pods were found').to.be.at.least(1);
            pods.forEach((p) => {
                expect(p.status.phase, `pod ${p.metadata.name} is not Running`).to.equal('Running');
            });
            // On a multi-node cluster a DaemonSet must produce more than one pod. We only assert
            // this when we could actually read >= 2 nodes, to avoid false failures where the node
            // role label is absent.
            if (nodeCount >= 2) {
                expect(pods.length, `expected multiple api-server pods on a ${nodeCount}-node cluster (DaemonSet)`).to.be.at.least(2);
            }
        });

        it('TID-162.2 every Running pod is reachable and registered in discovery', async function () {
            this.timeout(60 * 1000);
            const leadership = await getLeadership();
            expect(leadership.pods.length, 'no api-server pods to query').to.be.at.least(1);
            // Every Running pod must answer its internal leader endpoint.
            expect(leadership.reachablePods, `some pods did not answer /internal/v1/leader: ${JSON.stringify(leadership.pods)}`).to.equal(leadership.pods.length);
            // etcd discovery must know about at least every Running pod.
            expect(leadership.instances.length, 'discovery is missing some api-server instances').to.be.at.least(leadership.reachablePods);
        });
    });

    describe('leader election', () => {
        it('TID-162.3 exactly one leader is elected across all pods', async function () {
            this.timeout(60 * 1000);
            const leadership = await waitForLeader(FAILOVER_TIMEOUT);
            expect(leadership.redisLeader, 'no leader was elected (redis lock has no owner)').to.be.a('string');
            const leaders = leadership.pods.filter(p => p.isLeader);
            expect(leaders.length, `expected exactly one leader, got [${leaders.map(p => p.podName).join(', ')}]`).to.equal(1);
            expect(leaders[0].instanceId, 'leader pod instanceId does not match the redis lock owner').to.equal(leadership.redisLeader);
        });

        it('TID-162.4 redis lock owner and etcd discovery agree on the leader', async function () {
            this.timeout(60 * 1000);
            // The etcd discovery flag is updated fire-and-forget, so allow it to converge.
            await checkEqualWithRetries(
                async () => {
                    const l = await getLeadership();
                    return Boolean(l.redisLeader) && l.etcdLeader === l.redisLeader;
                },
                [],
                true,
                'etcd discovery leader matches redis lock owner',
                5000,
                6
            );
        });
    });

    describe('functional correctness under load balancing', () => {
        it('TID-162.5 a pipeline runs to completion across load-balanced pods', async function () {
            this.timeout(5 * 60 * 1000);
            const pipeline = buildEvalPipeline({ name: `multipod-fn-${Date.now()}`, sleepMs: 3000, withWebhook: false });
            const res = await runRaw(pipeline, token);
            expect(res.body, `unexpected run response: ${JSON.stringify(res.body)}`).to.have.property('jobId');
            const result = await getResult(res.body.jobId, 200, token);
            expect(result.status).to.equal('completed');
        });

        it('TID-162.6 read-after-write is consistent across pods', async function () {
            this.timeout(2 * 60 * 1000);
            const name = `multipod-consistency-${Date.now()}`;
            const descriptor = {
                name,
                nodes: [
                    {
                        nodeName: 'evalsleep',
                        algorithmName: 'eval-alg',
                        input: ['#@flowInput.inputs'],
                        extraData: { code: ['(input,require)=> { return input[0][1]; }'] }
                    }
                ]
            };
            const store = await storePipelinesWithDescriptor(descriptor, token, createdPipelines);
            expect([200, 201], `store failed: ${store.status} ${JSON.stringify(store.body)}`).to.include(store.status);

            // The Service load-balances these reads across all pods. Every read must return the
            // pipeline we just wrote - a pod serving stale in-memory state would fail here.
            const attempts = Math.max(20, podCount * 8);
            for (let i = 0; i < attempts; i++) {
                // eslint-disable-next-line no-await-in-loop
                const res = await getPipeline(name, token);
                expect(res.status, `read #${i + 1} returned ${res.status} (expected 200)`).to.equal(200);
                expect(res.body.name, `read #${i + 1} returned the wrong pipeline`).to.equal(name);
            }
        });
    });

    describe('singleton side effects (exactly once)', () => {
        it('TID-162.7 the result webhook fires exactly once', async function () {
            this.timeout(5 * 60 * 1000);
            if (!webhookResultUrl || !webhookReachable) {
                write_log('webhook collector is not configured/reachable - skipping webhook exactly-once test', 'warn');
                this.skip();
            }
            const pipeline = buildEvalPipeline({ name: `multipod-webhook-${Date.now()}`, sleepMs: 4000, withWebhook: true });
            const res = await runRaw(pipeline, token);
            const jobId = res.body.jobId;
            expect(jobId, `unexpected run response: ${JSON.stringify(res.body)}`).to.be.a('string');

            const result = await getResult(jobId, 200, token);
            expect(result.status).to.equal('completed');

            const delivered = await waitForWebhookResults(jobId, 1, FAILOVER_TIMEOUT);
            expect(delivered.length, 'result webhook was never delivered').to.be.at.least(1);

            // Wait long enough for any duplicate delivery (one per non-leader pod) to show up.
            await delay(DUPLICATE_WEBHOOK_GRACE);
            const finalCount = await countWebhookResults(jobId);
            expect(finalCount, `result webhook was delivered ${finalCount} times, expected exactly once`).to.equal(1);
        });
    });

    describe('leader failover', () => {
        it('TID-162.8 killing the leader pod elects a new leader', async function () {
            this.timeout(4 * 60 * 1000);
            if (podCount < 2) {
                this.skip();
            }
            const before = await waitForLeader(FAILOVER_TIMEOUT);
            expect(before.leaderPodName, 'no leader to kill').to.be.a('string');
            const oldLeaderPod = before.leaderPodName;
            const oldLeaderId = before.leaderInstanceId;
            const startCount = (await getApiServerPodNames()).length;

            write_log(`killing leader pod ${oldLeaderPod} (instanceId ${oldLeaderId})`);
            await deletePod(oldLeaderPod);

            const after = await waitForLeaderChange(oldLeaderId, FAILOVER_TIMEOUT);
            expect(after.leaderInstanceId, 'no new leader was elected after killing the leader').to.be.a('string');
            expect(after.leaderInstanceId, 'leadership did not move to a different instance').to.not.equal(oldLeaderId);
            expect(after.leaderPodName, 'new leader pod is not reachable').to.be.a('string');

            const leaders = after.pods.filter(p => p.isLeader);
            expect(leaders.length, `expected exactly one leader after failover, got [${leaders.map(p => p.podName).join(', ')}]`).to.equal(1);

            // The DaemonSet must recreate the killed pod.
            const recovered = await waitForApiServerPods(startCount, POD_RECOVERY_TIMEOUT);
            expect(recovered.length, 'killed api-server pod was not recreated by the DaemonSet').to.be.at.least(startCount);
        });

        it('TID-162.9 killing a follower pod keeps the same leader', async function () {
            this.timeout(4 * 60 * 1000);
            if (podCount < 2) {
                this.skip();
            }
            const before = await waitForLeader(FAILOVER_TIMEOUT);
            const follower = before.pods.find(p => p.instanceId && !p.isLeader && p.podName !== before.leaderPodName);
            expect(follower, 'no follower pod available to kill').to.exist;
            const startCount = (await getApiServerPodNames()).length;

            write_log(`killing follower pod ${follower.podName} (leader is ${before.leaderPodName})`);
            await deletePod(follower.podName);

            // Wait longer than lockTtl + backupInterval so a spurious election would have surfaced.
            await delay(12 * 1000);
            const after = await getLeadership();
            expect(after.leaderInstanceId, 'leader changed after killing a follower (unnecessary failover)').to.equal(before.leaderInstanceId);
            expect(after.leaderPodName, 'leader pod changed after killing a follower').to.equal(before.leaderPodName);

            const recovered = await waitForApiServerPods(startCount, POD_RECOVERY_TIMEOUT);
            expect(recovered.length, 'killed follower pod was not recreated by the DaemonSet').to.be.at.least(startCount);
        });

        it('TID-162.10 leader failover during a run completes the job and fires the webhook once', async function () {
            this.timeout(8 * 60 * 1000);
            if (podCount < 2) {
                this.skip();
            }
            if (!webhookResultUrl || !webhookReachable) {
                write_log('webhook collector is not configured/reachable - skipping failover exactly-once test', 'warn');
                this.skip();
            }
            const pipeline = buildEvalPipeline({ name: `multipod-failover-${Date.now()}`, sleepMs: 45 * 1000, withWebhook: true });
            const res = await runRaw(pipeline, token);
            const jobId = res.body.jobId;
            expect(jobId, `unexpected run response: ${JSON.stringify(res.body)}`).to.be.a('string');

            const started = await waitUntilJobStarted(jobId);
            expect(started, 'job never left pending state').to.not.equal(null);

            const before = await waitForLeader(FAILOVER_TIMEOUT);
            const oldLeaderId = before.leaderInstanceId;
            const startCount = (await getApiServerPodNames()).length;
            write_log(`killing leader ${before.leaderPodName} while job ${jobId} is running`);
            await deletePod(before.leaderPodName);

            const after = await waitForLeaderChange(oldLeaderId, FAILOVER_TIMEOUT);
            expect(after.leaderInstanceId, 'no new leader after killing the leader mid-run').to.not.equal(oldLeaderId);

            // Despite the leader dying mid-run, the new leader must drive the job to completion.
            const result = await getResult(jobId, 200, token, 5 * 60 * 1000, 5000);
            expect(result.status).to.equal('completed');

            // ...and the result webhook must still fire exactly once - no loss, no duplicate.
            const delivered = await waitForWebhookResults(jobId, 1, 90 * 1000);
            expect(delivered.length, 'result webhook was never delivered after failover').to.be.at.least(1);
            await delay(DUPLICATE_WEBHOOK_GRACE);
            const finalCount = await countWebhookResults(jobId);
            expect(finalCount, `result webhook was delivered ${finalCount} times after failover, expected exactly once`).to.equal(1);

            await waitForApiServerPods(startCount, POD_RECOVERY_TIMEOUT);
        });
    });
});
