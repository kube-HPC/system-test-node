var http = require('http');
var fs = require('fs');
const https = require('https');
const delay = require('delay');
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
    await delay(10000)
    fs.access(myArgs[0], fs.F_OK, (err) => {
        if (err) {
          console.error(err)
          return
        }
        var stats = fs.statSync(myArgs[0])
        var fileSizeInBytes = stats.size;
// Convert the file size to megabytes (optional)
      

        console.log(myArgs[0]  + " file exists size = " +fileSizeInBytes )
        //file exists
      })
}

 app()



