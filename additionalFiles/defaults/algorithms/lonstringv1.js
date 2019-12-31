const alg = {
    name: "lonstringv1",
    cpu: 1,
    gpu: 0,
    mem: "256Mi",
    minHotWorkers: 0,
    algorithmImage: "docker.io/hkubedev/lonstringv1:v1.0.3",
    type: "Image",
    options: {
        debug: false,
        pending: false
    }
}

module.exports = {alg}