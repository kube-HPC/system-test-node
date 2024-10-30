const alg = {
    "env": "python",
    "options": {
        "pending": false
    },
    "name": "stateless-time-statistics-tst",
    "entryPoint": "statelessGetSendTime.py",
    "cpu": 0.2,
    "mem": "60Mi",
    "minHotWorkers": 0,
    "algorithmImage": "docker.io/hkubedevtest/start-streaming:vzu3ucyu6",
    "type": "Image",
    "reservedMemory": "52Mi",
    "workerEnv": {
        "INACTIVE_WORKER_TIMEOUT_MS": 5000
    },
    "algorithmEnv": {
        "HKUBE_LOG_LEVEL": "DEBUG"
    }
}
module.exports = { alg }