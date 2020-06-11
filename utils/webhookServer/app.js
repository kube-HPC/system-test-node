const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require('mongoose');
// Initialize express and define a port
const app = express()
const PORT = 3000
mongoose.connect('mongodb://localhost/cats',{useNewUrlParser : true});
// Tell express to use body-parser's JSON parsing
app.use(bodyParser.json())

var webHoookSchema = new mongoose.Schema({
  jobId: String,
  status: String,
  timestamp: String
});

var resultsModel = new mongoose.model('results',webHoookSchema);
var progressModel = new mongoose.model('progress',webHoookSchema);


app.get('/', (req, res) => res.send('Hello webhook!!'))

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
// Start express on the defined port
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))