var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
fs = require('fs');
var session = require('cookie-session');
models = require('models');
mongoose.connect('mongodb://localhost:27017/PPL');
db = mongoose.connection;
db.on('error', function (err) {

    console.log('connection error', err);
});
db.once('open', function () {

    console.log('connected.');
});
router.get('/:team',function(req,res){
    var sess = req.session;
//    createMatch();
    // get this from session instead of params and db
        models.Team.findOne({
            name:req.params.team
        },function(err,teamInSession){
            models.Match.findOne({
                    $or:[
                    {
                        "team1.team": teamInSession
                    },
                    {
                        "team2.team": teamInSession
                    }
                    ],
            })
            .sort({
// the lastest match collection for the team, so create match collection in admin panel only for the upcoming match, not for all future matches
                timeOfMatch:-1
            })
            .exec(function(err,match){
                console.log(match);
                if(err)
                    res.send(err);
                else if(match.winner!=null){
                    res.send("No Matches for your team");
                }
                else{
                    req.session.team = teamInSession;
                    console.log(match.team1.team.toString());console.log(teamInSession._id.toString());
                    if((match.team1.team.toString()==teamInSession._id.toString()&&match.team1.playersStats.length!=1)||(match.team2.team.toString()==teamInSession._id.toString()&&match.team2.playersStats.length!=1)){
                        res.send("You have already chosen players for the match <a href='/Match'>Click here to go to match</a>");
                    }else{
                        //have to do this, because data storage on cookie is limited and will result in destruction of the session if limit is exceeded
                        match.team1.playersStats = null;
                        match.team2.playersStats = null;
                        req.session.match = match;
                        models.Player.find({
                            team:teamInSession
                        },function(err,players){
                          //  console.log(req.session.match);
                            if(err)
                                res.send(err);
                            else
                                res.render('selectPlayers',{
                                    list:players,
                                    matchId:match._id
                                });
                        });
                }
                }
                });
        });
});


module.exports = router;
// admin for creating match

 
