const stayUpTest = {
    name: "stayuptest",
    cpu: 0.3,
    gpu: 0,
    mem: "128Mi",
    reservedMemory: "256Mi",
    minHotWorkers: 0,
    env: "python",
    entryPoint: "stayup.py",
    type: "Image",
    options: {
      devMode: false,
      devFolder: null,
      pending: false
    },
    algorithmImage: "docker.io/hkubedevtest/stayup:v40ur9i25",
    workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 2000 }
  }

  module.exports = { stayUpTest }
