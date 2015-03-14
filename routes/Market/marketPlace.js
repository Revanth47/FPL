var express = require('express');
var router = express.Router();
var fs = require('fs');
var erfArr = JSON.parse(fs.readFileSync('erf.json','utf8'));
var session = require('cookie-session');
var async = require('async');

router.get('/',function(req,res){
    var sess = req.session;
    var teamInSession = sess.team;
    if(teamInSession == null){
        res.send("No Team Selected").end();
        return;
    }

    models.Player.find({
        team:teamInSession._id
    })
    .exec(function(err,data){
        if(err){
            console.log(err);
            res.send("Error").end();
            return;
        }
        var tempArray = Array();
        for(var i=0;i<data.length;i++)
            tempArray[i] = data[i].refer;
        models.DefaultPlayer.find({
            "_id":{
                $nin : tempArray
            }
            })
        .sort({
            name : 1
            })
        .exec(function(err,players){
                if(err){
                    console.log(err);
                    res.send("Error").end();
                    return;
                }
                console.log(teamInSession);
                res.render('marketPlace',{
                    team:teamInSession,
                    teamjs:JSON.stringify(teamInSession),
                    players:players,
                    playersjs:JSON.stringify(players)
                });         
        });
    });
});
router.post('/',function(req,res){
    var teamInSession = req.session.team;
    function redirect(error){
        models.Team.findOne({
            "_id":teamInSession["_id"]
        },function(err,teamInSession){
            req.session.team = teamInSession;
            if(err){
                res.send("Error").end();
                return;
            }
            res.redirect('/Market');
         });
   }
    switch(req.body.header){
        case "buyPlayer":
            if(req.body.team=="-1"){
                req.session.auctionCount++;
                redirect(false);
                return;
            }
            var object = {
                "team" : teamInSession,
                "player" : req.body.id
            }
            buyPlayer(object,redirect);
            break;
        default:
            break;
    }
});
router.post('/ajax',function(req,res){
    console.log("yolo");
    var teamInSession = req.session.team;
    switch(req.body.header){
        case "getPlayer":
            models.Player.find({
                team : teamInSession._id
            },function(err,data){
                if(err){
                    console.log(err);
                }
                console.log(data);
                res.send(JSON.stringify(data)).end();
            });
            break;
        default:
            break;
    }
});
function buyPlayer(object,callback){
    var player_id = object.player;
    models.Team.findOne({
        _id : object.team._id,
    },function(err,team){
        if(err){
            console.log(err);
            callback(true);
            return;
        }
            models.DefaultPlayer.findOne({
                "_id" : player_id
            },function(err,player){
                models.Player.findOne({
                    "refer":player_id,
                    "team":team._id
                },function(err,shouldBeNull){
                    if(err){
                        console.log(err);
                        callback(true);
                        return;
                    }
                    if(shouldBeNull!=null){
                        callback(false);
                        return;
                    }
                    if(team.cash<player.cost){
                        console.log("not enough cash");
                        callback(true);
                        return;
                    }
                    var PlayerInsert = new models.Player({
                        name : player["name"],
                        battingSkill : player["battingSkill"],
                        bowlingSkill : player["bowlingSkill"],
                        confidence : player["confidence"],
                        imgSource : player["playerId"],
                        cost : parseInt(player["cost"]),
                        refer : player,
                        team : team
                    });
                    PlayerInsert.save(function(err,data){
                        if(err){
                            console.log(err);
                            callback(true);
                            return;
                        }
                        team.cash = parseInt(team.cash - player["cost"]);
                        team.save(function(err){
                            if(err){
                                console.log(err);
                                callback(true);
                                return;
                            }
                            callback(false);
                        });
                 });
            });
        });
    });    
}
module.exports = router;
