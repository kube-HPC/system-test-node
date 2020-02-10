require('dotenv').config()
fs = require('fs')
const {
    KubeConfig,
    Client
} = require('kubernetes-client')
const path = require('path')
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
 
  const {
        write_log
    } = require(path.join(process.cwd(), 'utils/misc_utils'))

const deletePod = async (podName, namespace='default') => {
    let deletedPod = ''
    if (typeof podName !== "undefined") {
         write_log("start delete - " +podName)
        deletedPod = await client.api.v1.namespaces(namespace).pods(podName).delete()
    } else {
         write_log("Not delete")
    }
    return deletedPod
}

const filterPodsByName = async (name,namespace='default') => {
    const pod = await client.api.v1.namespaces(namespace).pods().get()

    const pods = pod.body.items.filter(obj => obj.metadata.name.startsWith(name))

    return pods
}

const getPodNode = async (podName,namespace='default') => {
    const pod = await client.api.v1.namespaces(namespace).pods(podName).get()
    const node = pod.body.spec.nodeName
    return node
}



module.exports = {
    client,
    deletePod,
    filterPodsByName,
    getPodNode
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