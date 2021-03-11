const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const delay = require('delay');
chai.use(chaiHttp);
const path = require('path')
const config = require(path.join(process.cwd(), 'config/config'))
const logger = require(path.join(process.cwd(), 'utils/logger'))


const storeDatasource = async (name,path)=>{

    const res = await chai.request(config.DsServerUrl)
    .post('/datasource')
    .type('form') //multipart/form-data
    .send({
        "name":name,
        "files":[path]
    })
    return res
}

const getDatasource =  async ()=>{

    const res = await chai.request(config.DsServerUrl)
        .get(`/datasource`)
    //logResult(res, "DatasourceUtils getDatasource")
    return res.body
}

const updateVersion = async ({
    dataSourceName,
    versionDescription = 'new-version',
    fileNames = [],
    files: _files = [],
    mapping: _mapping = [],
    droppedFileIds: _droppedFileIds = [],
}) => {

}

module.exports = {
    getDatasource,
    storeDatasource
}