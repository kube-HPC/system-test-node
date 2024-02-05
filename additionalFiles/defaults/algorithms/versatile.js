const alg = {
    name: "versatile",
    cpu: 0.1,
    gpu: 0,
    mem: "256Mi",
    minHotWorkers: 0,
    algorithmImage: "tamir321/versatile:04",
    type: "Image",
    options: {
        debug: false,
        pending: false
    },
    workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 2000 }
}

module.exports = { alg }