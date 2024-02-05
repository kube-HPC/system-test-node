const alg = {
    name: "lonstringv1",
    cpu: 0.1,
    gpu: 0,
    mem: "256Mi",
    minHotWorkers: 0,
    algorithmImage: "docker.io/hkubedevtest/lonstringv3:vq2vozy33",
    type: "Image",
    options: {
        debug: false,
        pending: false
    },
    workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 2000 }
}

module.exports = { alg }