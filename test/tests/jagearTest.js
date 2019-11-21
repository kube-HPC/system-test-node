const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const path = require('path');
const config = require(path.join(process.cwd(), 'config/config'));
const chaiHttp = require('chai-http');
const assertArrays = require('chai-arrays');
const fs  = require('fs');
const delay = require('delay');
const {
    getResult,
    runRaw
} = require(path.join(process.cwd(), 'utils/results'))

const {
    runStoredAndWaitForResults
} = require(path.join(process.cwd(), 'utils/pipelineUtils'))
const {getSpansByJodid}=  require(path.join(process.cwd(), 'utils/jagear'))
const tos = require(path.join(process.cwd(), 'utils/results'.toString()))
chai.use(chaiHttp);
chai.use(assertArrays);


describe('jagear',()=>{
    it('test',async () =>{

        const algName = "black-alg"
        const pipe = {"name": "versatile-pipe",
                         "flowInput": {
                         "inp": [
                         {
                             "type": "algorithm",
                             "name": `${algName}`
                         }
                        ]}
                    }

        const jobId = await runStoredAndWaitForResults(pipe)
        const data = await getSpansByJodid(jobId)
        let found = false
        data.forEach(element => {
            console.log(element.operationName)
            if(element.operationName.startsWith(algName) ){
                found = true                         
            }
            
        });
        
       found.should.be.true
    }).timeout(1000 * 60)
})
