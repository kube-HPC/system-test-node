const alg = {
    "env": "python",
    "options": {
        "pending": false
    },
    "name": "stateless-time-statistics-tst",
    "entryPoint": "statelessGetSendByMinuteTime.py",
    "cpu": 0.2,
    "mem": "60Mi",
    "minHotWorkers": 0,
    "algorithmImage": "docker.io/hkubedevtest/stateless-time-by-min-statistics:vr0igrkhm",
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