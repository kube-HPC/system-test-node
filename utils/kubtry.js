require('dotenv').config()
fs = require('fs')
const {
    KubeConfig,
    Client
} = require('kubernetes-client')
const kubeconfig = new KubeConfig()
kubeconfig.loadFromFile(process.env.K8S_CONFIG_PATH)

console.log(process.env.K8SCONFIGPATH)
const Request = require('kubernetes-client/backends/request')

const backend = new Request({
    kubeconfig
})
const client = new Client({
    backend,
    version: process.env.K8S_VERSION
})


kubeconfig.setCurrentContext('test')

const name = async () => {

    const pod = await client.api.v1.namespaces('default').pods().get()
    // fs.writeFileSync ('pods.json',JSON.stringify(pod.body.items))
    // console.log (pod)
    const containers = pod.body.items.filter(r => r.metadata.name.includes('api'))
    console.log(containers.length)
    // fs.writeFileSync('pods.json', JSON.stringify(containers))

    // console.log(JSON.stringify(containers, null, 4))
}

name()