var express = require('express');
var router = express.Router();
var fs = require('fs');
var erfArr = JSON.parse(fs.readFileSync('erf.json','utf8'));
var session = require('cookie-session');

// handles prematch and postmatch
router.post('/', function(req, res) {
    //prematch
      console.log(JSON.stringify(req.session));
      if(req.session.matchStatus == "pre-match"){
          var playersArray = JSON.parse(req.body.players);
          console.log(playersArray);
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
              if(sess.match.team1.team._id==sess.team._id){
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
           models.Match.findOne({
               _id : sess.match._id,
               winner : {
                   $ne : null
                }
            })
           .populate('winner')
           .exec(function(err,match){
               var resultText = "Match was won by "+match.winner.name;
               req.session.match = null;
               req.session.matchStatus = "post-match";
                    res.render('postmatch',{
                        result:resultText,
                        LayoutTeam : req.session.team,
                        partials : {
                            layout : 'layout'
                        }
                    });
            });
        }

});

router.get('/',function(req,res){
    if(!req.session.team){
        req.session.loginRedirect = "/Match";
        res.redirect('/login');
	return;
    }
    if(req.session.match&&req.session.match.winner==null){
           var matchId = req.session.match._id;
           models.Match.findOne({_id : matchId},function(err,data){
               if(err){
                   console.log(err);
                   return;
                }
                if(data==null){
                    req.session.match = null;
                    res.redirect('/Match/selectPlayers');
                    return;
                }
                var tm = "team2";
                if(data.team1.team.toString()==req.session.team._id)
                    tm = "team1";
                if(data.team1.playersStats.length==1||data.team2.playersStats.length==1){
                    if(data[tm].playersStats.length==1)
                        res.redirect('/Match/selectPlayers');
                    else
                        res.render('prematch');
                }
                else{
                    req.session.matchStatus = "inGame";
                    res.render('match',{
                        LayoutTeam : req.session.team,
                        partials : {
                            layout : 'layout'
                        }
                    });
                }
            });
    }
    else
        res.redirect('/Match/selectPlayers');
});
module.exports = router;
