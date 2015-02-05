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
        return res.send(401);
    };
    var user = basicAuth(req);
    if (!user || !user.name || !user.pass) {
        return unauthorized(res);
    };
    if (user.name === 'admin' && user.pass === 'adinguotha') {
        return next();
    } else {
        return unauthorized(res);
    };
}
router.get('/',auth,function(req,res){
    async.parallel([
        function(cb){
            //get teams;
            models.Team.find({},function(err,data){
                if(err){
                    console.log(err);
                    cb(null);
                    return;
                }
                cb(true,data);
            });
        }
    ],function(err,results){
      console.log(results);
      res.render("admin",{
            teams:results[0]
        });
    });
});
router.post('/',auth,function(req,res){
function render(err){
    res.send("yollo");       
}   
    var sess  = req.session;
        switch(req.body.header){
            case "createMatch":
                createMatch(req.body.id1,req.body.id2,render);
                break;
            case "createTeam":
                break;
            default:
                render(false);
        }
});

function createMatch(teamId1,teamId2,callback){
    if(teamId1==teamId2){
        callback(true);
        return;
    }
   models.Team.findOne({
        _id:teamId1
    },function(err,team1){
        if(err||team1==null){
            console.log(err);
            callback(true);
            return;
        }
        models.Team.findOne({
            _id:teamId2
        },function(err,team2){
            if(err||team2==null){
                console.log(err);
                callback(true);
                return;
            }
            var match = new models.Match({
                team1:{
                    team:team1
                },
                team2:{
                    team:team2
                }
            });
            match.save(function(err,data){
                if(err){
                    console.log(err);
                    callback(true);
                    return;
                }
                callback(false);
            });
        });
    });
}
module.exports = router;
