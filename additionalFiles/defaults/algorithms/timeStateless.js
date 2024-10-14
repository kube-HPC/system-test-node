const alg = {
    "env": "python",
    "options": {
        "pending": false
    },
    "name": "stateless-time-statistics-tst",
    "entryPoint": "statelessGetSendTime.py",
    "cpu": 0.3,
    "mem": "60Mi",
    "minHotWorkers": 0,
    "algorithmImage": "docker.io/hkubedevtest/start-streaming:v2i0hkqse",
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