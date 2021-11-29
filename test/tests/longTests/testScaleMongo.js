const axios = require('axios').default
const path = require("path");
const config = require(path.join(process.cwd(), 'config/config'))
const monogoQuery  =  (query)=>{
        
    const url = `${config.apiServerUrl}/exec/search`
    axios.get(url,{params : query})
  
}


const run = ()=>{
    const lim =100
    const arraySize =200
    setInterval(() => {
        console.log('iteration started');
        [...Array(arraySize).keys()].forEach(k=>{
          
            let query = {limit :lim,
                        experimentName: "main"} //"feddd"
         monogoQuery(query)
       
        } )
        console.log('iteration completed');
    }, 1000);

}



//run();