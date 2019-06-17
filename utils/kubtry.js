const {kubernetesApi} = require ('./kubernetes')

const res = await kubernetesApi.getResourcesPerNode()

console.log (res)