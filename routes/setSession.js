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
router.get('/:team',auth,function(req,res){
        var sess = req.session;
        models.Team.findOne({
            name:req.params.team
        },function(err,teamInSession){
            sess.team = teamInSession;
            console.log(sess.team);
//            res.redirect("/Match/selectPlayers");
            res.send("yolo").end();
        });
});
module.exports = router;
