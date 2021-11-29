const axios = require('axios').default
const path = require("path");
const config = require(path.join(process.cwd(), 'config/config'))
const chai = require("chai");
const delay = require('delay');

const expect = chai.expect;
const timeout = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };
const {generateRandomJson }= require(path.join(process.cwd(), 'utils/generateRandomJson'))
describe("stress tests " , ()=>{

    describe("streaming test", ()=>{
        const bigSring = (size)=>{
            let result=""
            for ( var i = 0; i < size; i++ ) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
             }
             return result
        } 
        var fs = require('fs');
      
        function getByteArray(filePath){
            let fileData = fs.readFileSync(filePath).toString('hex');
            let result = []
            for (var i = 0; i < fileData.length; i+=2)
            result.push('0x'+fileData[i]+''+fileData[i+1])
            return result;
        }

        const Image = getByteArray('test/tests/longTests/chamilion.jpeg')
       

        function getByteArrayBuffer(filePath){
            let fileData = fs.readFileSync(filePath);
          
            return fileData;
        }

        const sendToGateway = async (amount,gateway,rate,data,flow = null)=>{
            let url = `https://test.hkube.io/hkube/gateway/${gateway}/streaming/message`
            if (flow !==null){
                url = `https://test.hkube.io/hkube/gateway/${gateway}/streaming/message?flow=${flow}`
            }

            for(i=0;i<amount;i++){
                axios.post(url, data)
                await timeout(1/rate)
               
            }
        }

        it(" gateway Tikshov big message", async () =>{
            const data = generateRandomJson(4)
            data.ping=0
            const data1 = generateRandomJson(4)
            const dataSize= JSON.stringify(data).length/1024;
            console.log(`data size = ${dataSize}`);
            let z=0;
            let y=0;
            let intervalId =    setInterval(function (){sendToGateway(400,"raw-image-gateway",200,data);                                                       
                                                        z+=1;
                                                        console.log(`z=${z}`);
                                                        } ,27*1000 )


            await delay(50*60*1000)
            clearInterval(intervalId);
            console.log("end");
            // clearInterval(intervalId2);
          }).timeout(1000 * 70 * 60);

        it(" gateway Tikshov Interval", async () =>{
            const data = {"data":1,
            "data1":1,
            "data2":1,
            "data3":1,
            "data4":1,
            "data5":1,
            "data6":1,
            "data7":1,
            "data8":1,
            "data9":1,
            "data10":1,
            "data11":1}
            let intervalId =    setInterval(function (){sendToGateway(200,"raw-image-gateway",100,data);
                                                        console.log("~~~~~~~~~~~~~~");} ,27*1000 )

           
          }).timeout(1000 * 60 * 15);

        it(" gateway Tikshov Test", async () =>{
            const data = {"data":1,
            "data1":1,
            "data2":1,
            "data3":1,
            "data4":1,
            "data5":1,
            "data6":1,
            "data7":1,
            "data8":1,
            "data9":1,
            "data10":1,
            "data11":1}
        
            for(i=0;i<200;i++){
                const jnk = axios.post("https://test.hkube.io/hkube/gateway/raw-image-gateway/streaming/message", data)
                await timeout(10)
                console.log(i);
            }
          }).timeout(1000 * 60 * 7);

        it("send message to gateway jobid buffer", async () =>{

            const file = getByteArrayBuffer('test/tests/longTests/chamilion.jpeg')
            for(i=0;i<100;i++){

                const jnk =  await axios.post("https://test.hkube.io/hkube/gateway/images-gateway/streaming/message", file, {
                         headers: { "Content-Type": "application/octet-stream" }})
                         console.log(i);
            }
          }).timeout(1000 * 60 * 7);


        it("send message to gateway jobid", async () =>{
            // https://test.hkube.io/hkube/gateway/images-gateway/streaming/message"
          
            const url="hkube/gateway/images-gateway"
            const status = await axios.get(`https://test.hkube.io/${url}/streaming/info`)
 
            const data = {'test':1, 'image':Image}//['0xff', '0xd8', '0xff', '0xdb', '0x00', '0x84', '0x00', '0x03']
            
            try {
                let jnk = await axios.post(`https://test.hkube.io/${url}/streaming/message`,data)  
            } catch (error) {
                console.log(`Error ${error.response.status} - ${error.response.statusText}`);
            }          
            
            //console.log("starts loop")
            for (i=0;i<1;i++){
            //    const message = await axios.post(`https://test.hkube.io/${url}/streaming/message`,data)  
               // console.log(message.data)
            }
            
  
            //console.log("stop")

        }).timeout(1000 * 60 * 7);

        const sendMessage = async (data)=> {
            const url="hkube/gateway/raw-image-gateway"
            const jnk=  await axios.post(`https://test.hkube.io/${url}/streaming/message`,data)  
            return jnk ;
        }


    })
    const monogoQuery  = async (query)=>{
        
        const url = `${config.apiServerUrl}/exec/search`
        const res = await axios.get(url,{params : query})
        return res;
    }

    const getAllJobs = async (id)=>{
        const lim =100
        let query = {limit :lim,
                    experimentName: "main"} //"feddd"
        console.log('start query')
        const jnk = await monogoQuery(query)
        console.log(` found - ${jnk.data.hits.length}`)
        expect(jnk.data.hits.length).to.be.equal(lim)
        query.cursor = jnk.data.cursor
        let i=1
        let run = true
        const start =  new Date()
        console.log(`-${start}`)
        
        while(run){
            i++
            let res = await monogoQuery(query)
            query.cursor = res.data.cursor;
           
            (res.data.hits.length < lim) ? run=false : run= true


            console.log(`${id} -${i}  ${query.cursor} ${res.data.hits.length} took - ${res.data.timeTook}`)
        }
        
        const end =  Date.now()
        console.log(`${id}-${end}`)
        console.log(`${id}-time took ${start-end}`)
        //expect(jnk.data.hits.length).to.be.equal(lim)
    }

    const queryInSec = async (time)=>{
        const lim =100
        let query = {limit :lim,
            experimentName: "main"} 
        let intervalId =    setInterval(function (){monogoQuery(query)} ,1000 )

        await setTimeout(stop_interval, time*1000);
        
        function stop_interval()
            {
                clearInterval(intervalId);
            }
        
    }
   describe("mongo DB tests",()=>{

        it("query load",async ()=>{
            const lim =10
            let query = {limit :lim,
                experimentName: "main"} //"feddd"
            console.log('start query')
            const jnk = await monogoQuery(query)

            query.cursor = jnk.data.cursor

            const jnk1 = await monogoQuery(query)
            console.log(` found - ${jnk.data.hits.length}`)
            expect(jnk.data.hits.length).to.be.equal(lim)
        }).timeout(1000 * 60 * 2);



        it("query load loop",async ()=>{
            
            const lim =100
            let query = {limit :lim,
                        experimentName: "main"} //"feddd"
            console.log('start query')
            const jnk = await monogoQuery(query)
            console.log(` found - ${jnk.data.hits.length}`)
            expect(jnk.data.hits.length).to.be.equal(lim)
            query.cursor = jnk.data.cursor
            let i=1
            let run = true
            const start =  new Date()
            console.log(`-${start}`)
            
            while(run){
                i++
                let res = await monogoQuery(query)
                query.cursor = res.data.cursor;
               
                (res.data.hits.length < lim) ? run=false : run= true


                console.log(`${i}  ${query.cursor} ${res.data.hits.length} took - ${res.data.timeTook}`)
            }
            
            const end =  Date.now()
            console.log(`-${end}`)
            console.log(`time took ${start-end}`)
            //expect(jnk.data.hits.length).to.be.equal(lim)
        }).timeout(1000 * 60 * 2);


        it("multipale requests",async ()=>{

            let array = []
            for (i=0;i<30;i++){
                array.push(getAllJobs(i))
            }
            await Promise.all(array);

        }).timeout(1000 * 60 * 60);

        it("multipale same requests",async ()=>{

            let array = []
            for (i=0;i<100;i++){
                array.push(queryInSec(300))
            }
            await Promise.all(array);

        }).timeout(1000 * 60 * 60);

    it("",async()=>{

    setInterval(() => {
        [...Array(100).keys()].forEach(k=>{
            const lim =100
            let query = {limit :lim,
                        experimentName: "main"} //"feddd"
         monogoQuery(query)
        } )
    }, 1000);

    }).timeout(100000)



    describe("lagDriver test",()=>{

        const alg ={
            "name": "alg-1",
            "cpu": 0.1,
            "gpu": 0,
            "mem": "256Mi",
            "reservedMemory": "512Mi",
            "minHotWorkers": 0,
            "env": "python",
            "entryPoint": "mainV4",
            "type": "Code",
            "options": {
                "pending": false
            },
           
            "algorithmImage": "docker.io/hkubedevtest/alg-1:v9qqnb3n9",
          
        }

        const creatAlg = async (i)=>{
            alg.name = `alg-${i}`
            const message = await axios.post(`https://test.hkube.io/hkube/api-server/api/v1/store/algorithms`,alg)  
            return message
        }
        it("create 50 alg",async ()=>{

            for(i=1;i<51;i++){
                const jnk = creatAlg(i)
                console.log(jnk)
            }
        } ).timeout(100000)

        const pipe = {          
            "name": "alg-pipe",
            "nodes": [
                {
                    "nodeName": "alg",
                    "algorithmName": "alg-1",
                    "input": [
                        "#[0...300]"
                    ],
                    "kind": "algorithm"
                }
            ],
           
            "options": {
                "batchTolerance": 100,
                "progressVerbosityLevel": "debug",
                "ttl": 3600
            },
            "kind": "batch",
            "experimentName": "main",
            "priority": 3
        }

        const runPipe = async (i)=>{
            pipe.name = `alg-${i}-pipe`
            pipe.nodes[0].algorithmName = `alg-${i}`
            const message = await axios.post(`https://test.hkube.io/hkube/api-server/api/v1/exec/raw`,pipe)  
            return message
        }
        const timeToActivate=2
        it("run pipe with alg-i",async () =>{
            for(z=0;z<timeToActivate;z++){

                for(i=1;i<50;i++){
                    const jnk =await  runPipe(i)
                    //console.log(jnk)
                    console.log(`z=${z} , i=${i}`);
                }
                await timeout(1000)
                console.log(`z=${z}`)

            }
        }).timeout(10*60*1000)

        const deleteAlg =async (i)=>{
            const name = `alg-${i}`
            const message = await axios.delete(`https://test.hkube.io/hkube/api-server/api/v1/store/algorithms/${name}`)
            return message
        }


        it("delete ald",async ()=>{
            for(i=1;i<51;i++){
                const jnk =await  deleteAlg(i)
                console.log(jnk)
            }
        }).timeout(100000)

        it("status",async ()=>{
            for(i=1;i<50;i++){
                console.log(`=============alg-${i}==============`);
                const jnk= await getStatus(1)
                const groupByStatus = groupBy("status")
                const group = groupByStatus(jnk.data)
                for (const [key, value] of Object.entries(group)) {
                    console.log(key, value.length);
                  }

            }
        }).timeout(100000)

        const getStatus = async (i)=>{
            const list = await axios.get(`https://test.hkube.io/hkube/api-server/api/v1/pipelines/status?name=alg-${i}-pipe&limit=${timeToActivate}`)
            return list
        }
        function groupBy(key) {
            return function group(array) {
              return array.reduce((acc, obj) => {
                const property = obj[key];
                acc[property] = acc[property] || [];
                acc[property].push(obj);
                return acc;
              }, {});
            };
          }

    })


    describe("autocannon tests",()=>{

  /*    to use in command line
        ===============
        autocannon \
        -m POST \
        --body '{"name":"ErickWendel","currency":"BRL","preferences":{"description":"movies"}}' \
        -H "x-app-id: 1"  \
        -c 100 \
        -d 10 \
        http://localhost:3000

    */


        const autocannon = require('autocannon')

        it("send query",async ()=>{
            let query = {limit :100,
                experimentName: "main"}
            const search = `${config.apiServerUrl}/exec/search`
           // const res = await axios.get(url,{params : query})
            autocannon({
                url: search,                //'http://localhost:3000',
                method : "GET",
                connections: 10, //default
                pipelining: 1, // default
                duration: 10, // default
                workers: 4,
                body:`limit :100,experimentName: "main"`
                
                }, console.log)

            object_name[`Person_ID_Number_${i}`]
        }).timeout(100000)

       


    })
   })



})