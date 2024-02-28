const descriptor = {
    name: "sync-devFolder",
    nodes: [
        
        {
            nodeName: "devFolder",
            algorithmName: "sync-dev-folder",
            input: [
                {
                    devFolder: "/somePath"
                }
            ],
        }
    ],
}

 const input = {
     flowInput: {
         
     }
 }

module.exports = { descriptor, input }