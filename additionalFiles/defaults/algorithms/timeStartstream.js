const alg = {
  "env": "python",
  "options": {
    "pending": false
  },
  "name": "start-streaming-tst",
  "entryPoint": "startpoint.py",
  "type": "Image",
  "cpu": 0.1,
  "mem": "128Mi",
  "minHotWorkers": 0,
  "algorithmImage": "docker.io/hkubedevtest/start-streaming:vzu3ucyu6",
  "workerEnv": {
    "INACTIVE_WORKER_TIMEOUT_MS": 1000,
    "AUTO_SCALER_MAX_REPLICAS_PER_SCALE": 100
  },
  "reservedMemory": "52Mi",
  "errors": [],
  "algorithmEnv": {
    "HKUBE_LOG_LEVEL": "DEBUG"
  }
}
module.exports = { alg }