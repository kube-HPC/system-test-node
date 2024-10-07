const alg = {
    "env": "python",
    "options": {
        "devMode": false,
        "devFolder": null,
        "pending": false
    },
    "name": "statefull-time-statistics-tst",
    "entryPoint": "statefullGetSendTime.py",
    "cpu": 0.03,
    "mem": "128Mi",
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