


const body= {
    name: "simple",
    flowInput: {
        files: {
            link: "link1"
        }
    },
    webhooks: {
        "progress": "http://localhost:3003/webhook/progress",
        "result": "http://localhost:3003/webhook/result"
      },
    priority: 1
}




module.exports = {
    body   
}