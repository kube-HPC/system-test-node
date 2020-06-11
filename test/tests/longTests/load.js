const chai = require('chai');

const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')
var diff = require('deep-diff').diff

const {
    storePipeline,
    runStored,
    deletePipeline

} = require(path.join(process.cwd(), 'utils/pipelineUtils'))
const config = require(path.join(process.cwd(), 'config/config'))
const {
    randomize
} = require(path.join(process.cwd(), 'utils/createPipeline'))

const {
    getResult
  } = require(path.join(process.cwd(), 'utils/results'))

  function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function storPipesArray(array){
  
    for (pip in array){
        const rr = await storePipeline(array[pip])
        //console.log(rr)
    }
}

async function storPipeArrayAndCron(array,time){
  
    for (pip in array){
        array[pip].triggers = {}  
        array[pip].triggers.cron ={}
        array[pip].triggers.cron.pattern = `*/${time} * * * *`
        array[pip].triggers.cron.enabled = true
        array[pip].webhooks = {}
        array[pip].webhooks.progress = `${config.webhookUrl}/progress/${array[pip].name}`


       
        const rr = await storePipeline(array[pip])
        //console.log(rr)
    }
}

async function deleteArray(array){
  
    for (pip in array){
        const rr = await deletePipeline(array[pip].name)
      //  console.log(rr)
    }
}
describe(' load testing', () => {
  
  

    it('high rate pipeline execut',async()=>{
        let loops = 100 

       
       const pipe = {
           name: "simple"
       }
     
       let parents = []
       let firstPipes = []
       
   
      
   
    for (loop=0;loop<loops;loop++){
        var parents2 = await Promise.all([
            runStored(pipe),
            runStored(pipe),
            runStored(pipe),
            runStored(pipe),    
            timeout(1000)
        
        ])

            if (loop==0){firstPipes=parents2}
            if(parents2[0].status ==200){parents = parents2};
    }
        
    const firstResult = await getResult(firstPipes[0].body.jobId,200)
    const lastResult = await getResult(parents[0].body.jobId,200)    
    console.log("first duration = "+firstResult.timeTook)  
    console.log("last duration = "+lastResult.timeTook)  
    expect(lastResult.timeTook).to.be.lessThan((firstResult.timeTook*1.5))  
   }).timeout(1000 * 60 * 20)



   it('Run multiple random pipelines', async () => {
    
        await deletePipeline("ranpipe10")
        await deletePipeline("ranpipe15")
        await deletePipeline("ranpipe20")
        await deletePipeline("ranpipe25")

   
        const randPipe10 = randomize(10)
        randPipe10.name="ranpipe10"
        await storePipeline(randPipe10)
        const randPipe15 = randomize(15)
        randPipe15.name="ranpipe15"
        await storePipeline(randPipe15)
        const randPipe20 = randomize(20)
        randPipe20.name="ranpipe20" 
        await storePipeline(randPipe20)
        const randPipe25 = randomize(25)
        randPipe25.name="ranpipe25"
        await storePipeline(randPipe25)

       

        for (i=0;i<3;i++){
            var parents = await Promise.all([
                runStored({name:"ranpipe10"}),
                runStored({name:"ranpipe15"}),
                runStored({name:"ranpipe20"}),
                runStored({name:"ranpipe25"}),    
                timeout(900)
              
            ]);

           
        }
        
    

}).timeout(1000 * 60 * 5)

it('Run multiple random pipelines X3',async ()=>{
    const randomizeV = [15,20,25,30]

    
    const pipes =[]
    for(i=0;i<3;i++){
        randomizeV.forEach( function(a){
            let pipe = JSON.parse(JSON.stringify(randomize(a)))
            pipe.name = `${i}randpipe${a}`
            pipes.push(pipe)
            }
        )
    }
   await  storPipesArray(pipes)
   
   for(i=0;i<3;i++){
    const pipesRun =[]
    
    randomizeV.forEach( function(a){
        pipesRun.push( runStored({name:`${i}randpipe${a}`}))
        }
    )
    pipesRun.push(timeout(1500))
     
    const run = await Promise.all(pipesRun)
    console.log("run loop "+ i)
}
await  deleteArray(pipes)

}).timeout(1000 * 60 * 5)

it('cron multiple random pipelines X3',async ()=>{
    const randomizeV = [5,10,15,20,25,30]

    
    const pipes =[]
    for(i=0;i<3;i++){
        randomizeV.forEach( function(a){
            let pipe = JSON.parse(JSON.stringify(randomize(a)))
            pipe.name = `${i}randpipe${a}`
            pipes.push(pipe)
            }
        )
    }
   await  deleteArray(pipes)
   await  storPipeArrayAndCron(pipes,5)
   
}).timeout(1000 * 60 * 5)


})