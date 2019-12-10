const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')

const config = require(path.join(process.cwd(), 'config/config'))

const {
    testData1
} = require(path.join(process.cwd(), 'config/index')).tid_300
const logger = require(path.join(process.cwd(), 'utils/logger'))

const {
    getResult
} = require(path.join(process.cwd(), 'utils/results'))

const { 
    storePipeline,
    runStored,
    deconstructTestData,
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))
chai.use(chaiHttp);

const input = (a,b)=>{
 return   {
    name: "addmuldiv",
    flowInput: {
        addInput: a ,
        multInput :b
    }
   
}

}
//JSON.stringify(a)
// ,
// "options": {
//     "batchTolerance": 60,
//     "progressVerbosityLevel": "debug"
// }


const getRandomArry = (number)=>{
    let result = []
    for(i=0;i<number;i++){
        let a = Math.floor(Math.random() * 101);
        let b = Math.floor(Math.random() * 101);
        result.push([a,b]);
    }
    return result;
}

describe('TID-300- ', () => {
   
   
    it(" define_the_order_of_the_pipeline",async ()=>{
         //set test data to testData1
        const d = deconstructTestData(testData1)
        const a = getRandomArry(100);      
        const b = getRandomArry(100);
        let expected =[]
        for(i=0;i<a.length;i++){
            expected.push((a[i][0]+a[i][1])/(b[i][0]*b[i][1]))           
        }
      
         //store pipeline addmuldiv
          await storePipeline(d)          
         let inputData = input(a,b)
         //run the pipeline addmuldiv
         const res = await chai.request(config.apiServerUrl)
                    .post('/exec/stored')
                    .send(inputData)
         const jobId = res.abody.jobId
         await delay(5000);
         const result = await getResult(jobId, 200)
         let diff =[]
         result.data.forEach(element => {
           
            if(isFinite(element.result) ){
                diff.push(expected[element.batchIndex-1]-element.result)              
                 expect(diff).to.be.equal(0)
            }
            
         });
        
    }).timeout(1000 * 60 * 5);



});