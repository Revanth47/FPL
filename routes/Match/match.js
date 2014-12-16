var express = require('express');
var router = express.Router();
var fs = require('fs');
var erfArr = JSON.parse(fs.readFileSync('erf.json','utf8'));
var session = require('cookie-session');


router.post('/', function(req, res) {
      var playersArray = JSON.parse(req.body.players);
      var sess  = req.session;
      var updateQuery={};
      if(sess.match.team1.team==sess.team._id){
               updateQuery= {$set:{"team1.playersStats" : playersArray}};
        }else{
               updateQuery= {$set:{"team2.playersStats" : playersArray}};
        }
      models.Match.findOneAndUpdate({
            _id : sess.match._id
        },updateQuery,{
            new:true
        },function(err,data){
                if(err)
                    console.log(err);
                else{
                    res.send(data);
                  // if(data.team2.playerStats==null||data.team1.playerStats==null)//check if both teams have selected their players
                    //   res.send(data);
                    }
        });
//      console.log(sess.match);
//      console.log(sess.team);
});

router.get('/',function(req,res){
    var sess = req.session.team._id;
    res.render('match');
});
module.exports = router;
