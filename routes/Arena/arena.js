var express = require('express');
var router = express.Router();
var session = require('cookie-session');
var async = require('async');
module.exports = router;
function checkTeamMatchStatus(teamId,callback){
    models.Match.findOne({
        $or:[
        {
            "team1.team":teamId
        },{
            "team2.team":teamId
        }]
    })
    .sort({
        timeOfMatch:-1
    })
    .exec(function(err,match){
        if(err){
            console.log(err);
            callback(true);
        }
        else if(match&&match.winner==null)
            callback(false,match._id);
        else
            callback(false,null);

    });
}
router.get('/',function(req,res){
    var sess = req.session;
    var callback=function(err,matchId){
        if(err){
            res.send("Error").end();
            return;
        }
        if(matchId!=null){
            res.redirect('/Match');
            return;
        }
            res.render('arena',{
                team : JSON.stringify(sess.team)
            });

    }
    checkTeamMatchStatus(sess.team._id,callback);
});
