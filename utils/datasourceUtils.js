const path = require('path')
const config = require(path.join(process.cwd(), 'config/config'))
const fs = require('fs');

const axios = require('axios').default
const FormData = require('form-data');
const { stringify } = require('querystring');



const createInternalDS =  async (name)=>{

    const formData = new FormData();
    formData.append("name",name);
    formData.append("storage",JSON.stringify({ "kind": "internal"}));
    formData.append("git",JSON.stringify({ "kind": "internal"}));
    const options = {
        method: "post",
        url: config.DsServerUrl,
        
        headers: formData.getHeaders(),
        data : formData
    }; 
    try {
        const jnk =await axios(options);
        return jnk
    } catch (error) {
        console.error(error)
    }
   
}
const uploadFileToDataSource = async (dataSourceName,FilePath,CommitMessage)=>{
        const formData = new FormData();
        formData.append( "versionDescription",CommitMessage)
        if (Array.isArray(FilePath)){
            FilePath.forEach(element => {
                formData.append('files', fs.createReadStream(element));
                
            });
        }
        else{
            formData.append('files', fs.createReadStream(FilePath));
        }
        
        const url = config.DsServerUrl+"/"+dataSourceName;
        const res = await axios.post(url, formData, {  headers: formData.getHeaders()});
        return res;
        
    }

const deleteDataSource = async (dataSourceName)=>{
    const url = config.DsServerUrl+"/"+dataSourceName;
    res = await axios.delete(url)
}
const getDatasource =  async ()=>{
    const url = config.DsServerUrl
    const res = await axios.get(url)
    return res;
}

const getDatasourceByName =  async (name)=>{
    const url = `${config.DsServerUrl}/${name}`
    const res = await axios.get(url)
    return res;
}

const createSnapshot =  async (DsName,SnapName,query)=>{
    const snap = {"snapshot": {
        "name":SnapName,
        "query": query
        }}            
    const res = await axios.post(`${config.DsServerUrl}/${DsName}/snapshot`,snap)  
    return res    
}

const createSnapshotOnId =  async (commitId,SnapName,query)=>{
    const snap = {"snapshot": {
        "name":SnapName,
        "query": query
        }}  
    const res = await axios.post(`${config.DsServerUrl}/id/${commitId}/snapshot`,snap)      
    return res
}

const getSnapshot = async (DsName,SnapName)=>{
    const res = await axios.get(`${config.DsServerUrl}/${DsName}/snapshot/${SnapName}`)
    return res
}

const getDsSnapshots = async (DsName)=>{
    const res = await axios.get(`${config.DsServerUrl}/${DsName}/snapshot`)
    return res
}
module.exports = {
    createInternalDS,
    uploadFileToDataSource,
    getDatasource,
    deleteDataSource,
    getDatasourceByName,
    createSnapshot,
    createSnapshotOnId,
    getSnapshot,
    getDsSnapshots
    
}