const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path')
const delay = require('delay')

const {  getDatasource,
        storeDatasource} = require(path.join(process.cwd(), 'utils/datasourceUtils'));
const {
        pipelineRandomName} = require(path.join(process.cwd(), 'utils/pipelineUtils'))

        const dsName= pipelineRandomName(8).toLowerCase()    
        describe('Datasource Tests', () => { 

            it("create ds",async ()=>{
                const code = path.join(process.cwd(), 'additionalFiles/pythonAlg/pythonApi.tar.gz')
                const jnk = await storeDatasource(dsName,code)
                console.log(jnk)
            }).timeout(1000 * 60 * 5);
            it("get ds", async () =>{

                const ds = await getDatasource()
                console.log(ds)
            }).timeout(1000 * 60 * 5);


        })