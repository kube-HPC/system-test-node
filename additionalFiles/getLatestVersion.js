var http = require('http');
var fs = require('fs');
const https = require('https');
const delay = require('delay');
const latest ="https://github.com/kube-HPC/hkubectl/releases/latest"



const operation = async ()=>{
    await https.get(latest,async function (res) {
    
            if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location) {
               
                const version= res.headers.location.split("/").pop()
                console.log(version)
            } 
        });
    }   
async function app() {
    
    var a = await operation() 
    
}

 app()



