const alg = {
    name: "tensorboard",
    cpu: 0.1,
    gpu: 0,
    mem: "5Gi",
    minHotWorkers: 0,
    algorithmImage: "docker.io/hkubedevtest/tensor11:v1.0.0",
    type: "Image",
    options: {
        debug: false,
        pending: false
    },
    workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 2000 }
}


module.exports = { alg }