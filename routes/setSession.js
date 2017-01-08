var express = require('express');
var router = express.Router();
var fs = require('fs');
var erfArr = JSON.parse(fs.readFileSync('erf.json','utf8'));
var session = require('cookie-session');
var async = require('async');
var basicAuth = require('basic-auth');
var auth = function (req, res, next) {
    function unauthorized(res) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.send(401).end();
    };
    var sess = req.session;
    var user = basicAuth(req);
    if (!user || !user.name || !user.pass || sess.team) {
        console.log(sess.team);
        return unauthorized(res);
    };
    if (user.name === 'admin' && user.pass === 'adinguotha') {
        return next();
    } else {
        return unauthorized(res);
    };
}

router.get('/',auth,function(req,res){
        models.Team.find({
            playerCount:{$gt:10}
        },function(err,teams){
            console.log(teams);
            res.render('setSession',{
                teams:teams
            });
        });
});

router.post('/',auth,function(req,res){
        var sess = req.session;
        console.log(req.body.team);
        models.Team.findOne({
            name:req.body.team
        },function(err,teamInSession){
            if(err){
                res.send(400).end();
            }
            sess.team = teamInSession;
            console.log(sess.team);
            res.redirect("/Match/selectPlayers");
        });
});
module.exports = router;
