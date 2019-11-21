


const body= {
    name: "simple",
    flowInput: {
        files: {
            link: "link1"
        }
    },
    webhooks: {
        "progress": "http://my-url-to-progress",
        "result": "http://my-url-to-result"
      },
    priority: 1
}




module.exports = {
    body   
}