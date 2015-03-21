var express = require('express');
var router = express.Router();
var session = require('cookie-session');
var async = require('async');
var globalFunctions = require('../globalFunctions');

module.exports = router;
router.get('/',function(req,res){
    var sess = req.session;
    var callback=function(err,matchId,playerRestriction){
        if(err){
            res.send("Error").end();
            return;
        }
	if(playerRestriction){
		res.send("You dont have 11 players.<a href='/Market'>Click here to buy them</a>").end();
		return;
	}
        if(matchId!=null){
            res.redirect('/Match');
            return;
        }
            res.render('arena',{
                team : JSON.stringify(sess.team),
                LayoutTeam : req.session.team,
                partials : {
                    layout : 'layout'
                }
            });

    }
    if(sess.team)
        globalFunctions.checkTeamMatchStatus(sess.team._id,callback);
    else{
         req.session.loginRedirect = '/Arena'; 
         res.redirect('/login');
    }
});
