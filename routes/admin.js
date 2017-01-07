var express = require('express');
var router = express.Router();
var fs = require('fs');
var obj = JSON.parse(fs.readFileSync('players.json', 'utf8'));
var session = require('cookie-session');
var async = require('async');
var basicAuth = require('basic-auth');
var models = require('../models');

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
router.get('/import',auth,function(req,res){
    console.log(obj.length);
    for(var i=0;i<obj.length;i++){
            if(obj[i]["name"]!=null){
                var player = new models.Player({
                    name : obj[i]["name"],
                    battingSkill : obj[i]["batting"],
                    bowlingSkill : obj[i]["bowling"],
                    confidence : obj[i]["confidence"],
                    team : null,
                    imgSource : obj[i]["playerId"],
                    cost : parseInt(obj[i]["cost"]/1000)
                });
                player.save(function(err,data){
                    if(err){
                        console.log(err);
                    }
                });
            }
     }
});
router.get('/',auth,function(req,res){
    async.parallel([
        function(cb){
            //get teams;
            models.Team.find({},function(err,data){
                if(err){
                    console.log(err);
                    cb(true);
                    return;
                }
                cb(null,data);
            });
        },
        function(cb){
            //get matches
            models.Match.find({})
            .populate("team1.team team2.team")
            .exec(function(err,data){
                if(err){
                    console.log(err);
                    cb(true);
                    return;
                }
                cb(null,data);
            });
         }],function(err,results){
      if(err){
            res.send("check logs");
          return;
      }
      console.log(results);
      res.render("admin",{
            teams:results[0],
            matches:results[1]
        });
    });
});
router.post('/',auth,function(req,res){
function render(err){
    if(err){
        res.send("check logs").end();
        return;
    }
    res.redirect('/admin');
}   
        switch(req.body.header){
            case "createMatch":
                createMatch(req.body.id1,req.body.id2,render);
                break;
            case "createTeam":
                createTeam(req.body.name,render);
                break;
            case "editMatch":
                if("delete" in req.body)
                    deleteMatch(req.body['delete'],render);
                break;
            default:
                render(false);
        }
});
function deleteMatch(matchId,callback){
    models.Match.findOneAndRemove({
        _id : matchId
    },function(err,data){
        if(err){
            console.log(err);
            callback(true);
        }
        callback(false);
    });
}
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
                    team:team1._id
                },
                team2:{
                    team:team2._id
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
function createTeam(name,callback){
    if(name==null||name==""){
        callback(true);
        return;
    }
    var team = new models.Team({
        name : name
    });
    team.save(function(err,data){
        if(err){
            console.log(err);
            callback(true);
            return;
        }
        callback(false);
    });
}
module.exports = router;
