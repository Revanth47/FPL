var express = require('express');
var router = express.Router();
var fs = require('fs');
var erfArr = JSON.parse(fs.readFileSync('erf.json','utf8'));
var session = require('cookie-session');

// handles prematch and postmatch
router.post('/', function(req, res) {
    //prematch
      if(req.body.header == "init"){
          var playersArray = JSON.parse(req.body.players);
          //console.log(req);
          var sess  = req.session;
          var tempArray = Array();
          for(var i=0;i<11;i++)
              tempArray[i] = playersArray[i].player;
          models.Player.find({
              "_id":{
                  $in : tempArray
                },
              "team":sess.team._id 
            },function(err,data){
                if(err){
                    console.log(err);
                    return;
                }
                if(data.length!=11){
                    res.send("woah,we got a hacker here..real badass man!").end();
                    return;
                }
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
          });
      }
      //postmatch
      else{
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
                    resultText = match.team2.team.name + " won the match with " + parseInt(match.matchSpecs.numberOfOvers*6 - match.team1.ballsBowled) + " balls to spare.";
                    winnerId = match.team2.team._id;
                }else{
                    //postponed to next version
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

    if(req.session.match&&req.session.match.winner==null){
           var matchId = req.session.match._id;
           models.Match.findOne({_id : matchId},function(err,data){
               if(err){
                   console.log(err);
                   return;
                }
                var tm = "team2";
                if(data.team1.team.toString()==req.session.team._id)
                    tm = "team1";
                if(data.team1.playersStats.length==1||data.team2.playersStats.length==1){
                    if(data[tm].playersStats.length==1)
                        res.redirect('selectPlayers');
                    else
                        res.render('prematch');
                }
                else
                    res.render('match');
            });
    }
    else
        res.redirect('selectPlayers');
});
module.exports = router;
