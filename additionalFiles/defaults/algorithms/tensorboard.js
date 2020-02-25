const alg = {
    name: "tensorboard",
    cpu: 1,
    gpu: 0,
    mem: "5Gi",
    minHotWorkers: 0,
    algorithmImage: "docker.io/hkubedev/tensor1:v1.0.1",
    type: "Image",
    options: {
        debug: false,
        pending: false
    }
}


module.exports = {alg}