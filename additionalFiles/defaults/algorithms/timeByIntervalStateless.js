const alg = {
    "env": "python",
    "options": {
        "pending": false
    },
    "name": "stateless-time-by-interval-tst",
    "description": "args (default value): first_process_time (1), second_process_time (0.1), interval in sec (60)",
    "entryPoint": "statelessGetSendByIntervalTime.py",
    "cpu": 0.2,
    "mem": "60Mi",
    "minHotWorkers": 0,
    "algorithmImage": "docker.io/hkubedevtest/stateless-time-by-interval-tst:v7qqen5f5",
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
