require('dotenv').config()
fs = require('fs')
const {
    KubeConfig,
    Client
} = require('kubernetes-client')
const kubeconfig = new KubeConfig()
kubeconfig.loadFromFile(process.env.K8S_CONFIG_PATH)

const Request = require('kubernetes-client/backends/request')

const backend = new Request({
    kubeconfig
})
const client = new Client({
    backend,
    version: process.env.K8S_VERSION
})


kubeconfig.setCurrentContext(process.env.K8S_CONTEXT)

module.exports = {
    client
}


// const name = async () => {

// const pod = await client.api.v1.namespaces('default').pods().get()
//     // fs.writeFileSync ('pods.json',JSON.stringify(pod.body.items))
//     // console.log (pod)
//     const containers = pod.body.items.filter(r => r.metadata.name.includes('eval-alg2'))
//     console.log(containers.length)
//     // console.log(containers)
//     fs.writeFileSync('pods.json', JSON.stringify(containers))

//     // console.log(JSON.stringify(containers, null, 4))
// }

// name()