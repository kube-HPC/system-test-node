require('dotenv').config()
fs = require('fs')
const {
    KubeConfig,
    Client
} = require('kubernetes-client')
const path = require('path')
const kubeconfig = new KubeConfig()
kubeconfig.loadFromFile(process.env.K8S_CONFIG_PATH)
const {
    testData1
} = require(path.join(process.cwd(), 'config/index')).tid_161
const {
    deletePipeline,
    getPiplineNodes,
    storePipeline,
    runStored,
    deconstructTestData,
    runStoredAndWaitForResults
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))
const chai = require('chai');
const expect = chai.expect;
const delay = require('delay')
const Request = require('kubernetes-client/backends/request')
const {
    getResult
} = require(path.join(process.cwd(), 'utils/results'))
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


const getNodes = async (namespace='default')=>{

    const res = await client.api.v1.nodes.get()//await client.api.v1.namespaces(namespace).getNodes();
    return res.body.items.map((n)=>{return n.metadata.name})
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

const FailSingelPod = async (podName, namespace = 'default') => {
    //set test data to testData1
    const d = deconstructTestData(testData1)

    //store pipeline evalwait
    await deletePipeline(d)
     await storePipeline(d)

    //run the pipeline evalwait
    const res = await runStored(d)
    const jobId = res.body.jobId
    await delay(5000)
    const ServewrPod = await filterPodsByName(podName,namespace)
    write_log(ServewrPod[0].metadata.name)
    const deleted = await deletePod(ServewrPod[0].metadata.name, namespace)
    await delay(15000)

    const result = await getResult(jobId, 200)

    expect(result.status).to.be.equal('completed');

    const newServer = await filterPodsByName(podName,namespace)
    write_log(newServer[0].metadata.name)
    expect(ServewrPod[0].metadata.name).to.be.not.equal(newServer[0].metadata.name)


}

module.exports = {
    FailSingelPod,
    client,
    deletePod,
    filterPodsByName,
    getPodNode,
    getNodes
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