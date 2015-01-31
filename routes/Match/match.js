var express = require('express');
var router = express.Router();
var fs = require('fs');
var erfArr = JSON.parse(fs.readFileSync('erf.json','utf8'));
var session = require('cookie-session');

// handles prematch and postmatch
router.post('/', function(req, res) {
      if(req.body.header == "init"){
          var playersArray = JSON.parse(req.body.players);
          //console.log(req);
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
                        res.render('prematch');
                        }
            });
      }else{
           var sess = req.session;
           var matchId = sess.match._id;
           models.Match.findOne({_id : matchId})
           .populate('team1.team team2.team')
           .exec(function(err,match){
               if(err){
                   console.log(err);
                   return;
                }
                var resultText = "";
                var winnerId;
                if(match.team1.runsScored>match.team2.runsScored){
                    resultText = match.team1.team.name + " won the match by " + parseInt(match.team1.runsScored - match.team2.runsScored) + " runs.";
                    winnerId = match.team1.team._id;
                }else if(match.team1.runsScored<match.team2.runsScored){
                    resultText = match.team2.team.name + " won the match by " + parseInt(match.team2.runsScored - match.team1.runsScored) + " runs.";
                    winnerId = match.team2.team._id;
                }else{

                }
            match.winner = winnerId;
            match.save(function(err,data){
                if(err)
                    console.log(err);
            });
                res.render('postmatch',{
                    result:resultText
                });
            });
        }
});

router.get('/',function(req,res){
    if(req.session.match&&req.session.match.winner==null)
            res.render('match');
    else
        res.send(404);
});
module.exports = router;
