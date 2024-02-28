const syncAlg = {
        name: "sync-dev-folder",
        description: "Takes path as input, and passes/fails depending on file1.txt existance in the path",
        cpu: 1,
        gpu: 0,
        mem: "128Mi",
        reservedMemory: "256Mi",
        minHotWorkers: 0,
        env: "python",
        entryPoint: "sync_devFolder.py",
        algorithmImage: "docker.io/hkubedevtest/sync-dev-folder:vw1i9rtgk",
        type: "Image",
        workerEnv: { INACTIVE_WORKER_TIMEOUT_MS: 2000 }
}

module.exports = { syncAlg }
