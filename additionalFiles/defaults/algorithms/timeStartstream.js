const alg = {
  "env": "python",
  "options": {
    "pending": false
  },
  "name": "start-streaming-tst",
  "entryPoint": "startpoint.py",
  "type": "Image",
  "cpu": 0.01,
  "mem": "128Mi",
  "minHotWorkers": 0,
  "algorithmImage": "docker.io/hkubedevtest/start-streaming:v2i0hkqse",
  "workerEnv": {
    "INACTIVE_WORKER_TIMEOUT_MS": 1000,
    "AUTO_SCALER_MAX_REPLICAS_PER_SCALE": 30
  },
  "reservedMemory": "52Mi",
  "errors": [],
  "algorithmEnv": {
    "HKUBE_LOG_LEVEL": "DEBUG"
  }
}
module.exports = { alg }