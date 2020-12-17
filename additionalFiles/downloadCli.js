var http = require('http');
var fs = require('fs');
const https = require('https');

const latest ="https://github.com/kube-HPC/hkubectl/releases/latest"



const operation = async (file)=>{
    await https.get(latest,async function (res) {
    
            if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location) {
                console.log(res.headers.location)
                const version= res.headers.location.split("/").pop()
                await https.get(`https://github.com/kube-HPC/hkubectl/releases/download/${version}/hkubectl-win.exe`, async function(response) { // hkubectl-win.exe
                    await response.pipe(file);
                    });
                console.log("done")
            } 
        });
    }   
async function app() {
    var myArgs = process.argv.slice(2);
    console.log('myArgs: ', myArgs);
    const file = fs.createWriteStream(myArgs[0]);
    var a = await operation(file) 
}

 app()



