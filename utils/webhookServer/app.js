const chai = require('chai');
const chaiHttp = require('chai-http');
const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require('mongoose');
// Initialize express and define a port
const randomize = require("./createPipeline").randomize
chai.use(chaiHttp);
const app = express()
const PORT = 3000
mongoose.connect('mongodb://localhost/cats',{useNewUrlParser : true});
const config = require('./config')
// Tell express to use body-parser's JSON parsing
app.use(bodyParser.json())

var webHoookSchema = new mongoose.Schema({
  jobId: String,
  status: String,
  timestamp: String
});

var resultsModel = new mongoose.model('results',webHoookSchema);
var progressModel = new mongoose.model('progress',webHoookSchema);
const delay = mili => new Promise(r => setTimeout(r, mili))


const runRaw = async (body) => {
 // process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0
  const res = await chai.request(config.apiServerUrl) //'https://54.229.7.145/hkube/api-server/api/v1')
      .post('/exec/raw')
      .send(body)
  return res
}


let enableRun = true;


const runRandomPipelines = async (duration=1) => {
  
  
  const start = Date.now()
  const hours = duration
  end = new Date(start + (1000 * 60 * 60 * hours)).getTime()

   let i =1;
  let now = Date.now()
 
    while (now < end && enableRun) {
      const pipe = randomize()
  //const r  =  await 
      await runRaw(pipe)
      console.log("I am sending jnk-"+i)
      await delay(2*60*1000)
      now = Date.now()
      i++

  }
  
  
}

app.get('/', (req, res) => res.send('Hello webhook!!'))
app.get('/runrandom/start/',(req, res) => {   
  enableRun= true;
  runRandomPipelines(config.webhookUrl);
  res.send('Hello runrandom starts!!') // Responding is important
  
})
app.get('/runrandom/end',(req, res) => {   
  enableRun= false;
  res.send('Hello runrandom end!!') // Responding is important
  
})
app.get('/progress/:id',function(req,res){
  progressModel.find({jobId : req.params.id},function(err,progData){
    if (err){
      res.status(406)
      res.json({info: 'error during find prog data ', error:err});
      return
    };
    if(progData){
        res.json({info: 'progData found successfully',data: progData});
    } else {
        res.status(206).json({info: 'progData was not found '});
    }
    })
})

app.post("/progress", (req, res) => {   
    var newhook = new progressModel({jobId: req.body.jobId,
                                      status : req.body.status,
                                      timestamp  : req.body.timestamp});
    newhook.save(function(err){
                    if (err){                        
                        res.json({info: 'error during create', error:err});
                    }});

    res.status(200).end() // Responding is important
    
  })
  
  app.post("/progress/:test", (req, res) => { 
   
    var TestProgressModel = new mongoose.model(req.params.test,webHoookSchema);
    
    
    var newhook = new TestProgressModel({jobId: req.body.jobId,
                                      status : req.body.status,
                                      timestamp  : req.body.timestamp});
    newhook.save(function(err){
                    if (err){                        
                        res.json({info: 'error during create', error:err});
                    }});

    res.status(200).end() // Responding is important
    
  })

  app.delete("/progress/:test",(req,res)=>{

    var TestProgressModel = new mongoose.model(req.params.test,webHoookSchema);
    TestProgressModel.delete({},function(err,deleted){
      if (err){
        res.status(406)
        res.json({info: 'error during find prog data ', error:err});
        return
      };
        res.json({info: 'progData found successfully',data: deleted});
    })


  })
  app.get('/progress/:test/:id',function(req,res){
    var TestProgressModel = new mongoose.model(req.params.test,webHoookSchema);
    TestProgressModel.find({jobId : req.params.id},function(err,progData){
      if (err){
        res.status(406)
        res.json({info: 'error during find prog data ', error:err});
        return
      };
      if(progData){
          res.json({info: 'progData found successfully',data: progData});
      } else {
          res.status(206).json({info: 'progData was not found '});
      }
      })
  })

  app.get('/progress/:test/all',function(req,res){
    var TestProgressModel = new mongoose.model(req.params.test,webHoookSchema);
    TestProgressModel.find({},function(err,progData){
      if (err){
        res.status(406)
        res.json({info: 'error during find prog data ', error:err});
        return
      };
      if(progData){
          res.json({info: 'progData found successfully',data: progData});
      } else {
          res.status(206).json({info: 'progData was not found '});
      }
      })
  })
  
  app.post("/results", (req, res) => {
    var newhook = new resultsModel({jobId: req.body.jobId,
      status : req.body.status,
      timestamp  : req.body.timestamp});
      newhook.save(function(err){
      if (err){                        
        res.json({info: 'error during create', error:err});
      }});

      res.status(200).end() // Responding is important
    
  })

  app.get('/results/:id',function(req,res){
    resultsModel.find({jobId : req.params.id},function(err,resultData){
      if (err){
        res.status(406)
        res.json({info: 'error during find resulr data ', error:err});
        return
      };
      if(resultData){
          res.json({info: 'resultData found successfully',data: resultData});
      } else {
          res.status(206).json({info: 'resultData was not found '});
      }
      })
  })

  app.post("/results/:test", (req, res) => { 
   
    var TestProgressModel = new mongoose.model(req.params.test,webHoookSchema);
    
    
    var newhook = new TestProgressModel({jobId: req.body.jobId,
                                      status : req.body.status,
                                      timestamp  : req.body.timestamp});
    newhook.save(function(err){
                    if (err){                        
                        res.json({info: 'error during create', error:err});
                    }});

    res.status(200).end() // Responding is important
    
  })

  app.delete("/results/:test",(req,res)=>{

    var TestProgressModel = new mongoose.model(req.params.test,webHoookSchema);
    TestProgressModel.delete({},function(err,deleted){
      if (err){
        res.status(406)
        res.json({info: 'error during find prog data ', error:err});
        return
      };
        res.json({info: 'progData found successfully',data: deleted});
    })


  })
  app.get('/results/:test/:id',function(req,res){
    var TestProgressModel = new mongoose.model(req.params.test,webHoookSchema);
    TestProgressModel.find({jobId : req.params.id},function(err,progData){
      if (err){
        res.status(406)
        res.json({info: 'error during find prog data ', error:err});
        return
      };
      if(progData){
          res.json({info: 'progData found successfully',data: progData});
      } else {
          res.status(206).json({info: 'progData was not found '});
      }
      })
  })

  app.get('/progress/:test/all',function(req,res){
    var TestProgressModel = new mongoose.model(req.params.test,webHoookSchema);
    TestProgressModel.find({},function(err,progData){
      if (err){
        res.status(406)
        res.json({info: 'error during find prog data ', error:err});
        return
      };
      if(progData){
          res.json({info: 'progData found successfully',data: progData});
      } else {
          res.status(206).json({info: 'progData was not found '});
      }
      })
  })

// Start express on the defined port
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))