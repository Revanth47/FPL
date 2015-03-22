var express = require('express');
var router = express.Router();
var fs = require('fs');
var erfArr = JSON.parse(fs.readFileSync('erf.json','utf8'));
var session = require('cookie-session');
var async = require('async');
var globalFunctions = require('../globalFunctions');

router.get('/',function(req,res){
    var sess = req.session;
    var teamInSession = sess.team;
    if(teamInSession == null){
        req.session.loginRedirect = '/Market';
        res.redirect('/login');
        return;
    }
var callback = function(err,matchId){
    if(err){
	res.send("error").end();
	return;
    }
    if(matchId!=null){
	res.redirect('/Match');
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
                    LayoutTeam : req.session.team,
                    teamjs:JSON.stringify(teamInSession),
                    players:players,
                    playersjs:JSON.stringify(players),
                    partials:{
                        layout : 'layout'
                    }
                });         
        });
    });
}
globalFunctions.checkTeamMatchStatus(teamInSession._id,callback);
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

        case "clearAllPlayers":
            var object = {
                "team" : teamInSession
            }
            clearPlayers(object,redirect);
            break;
        case "randomizeTeam":
            var object = {
                "team" : teamInSession
            }
            var callback = function(){
                randomizeTeam(object,redirect);
            }
            clearPlayers(object,callback);
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
        case "buyPlayer":
            var object = {
                "team" : teamInSession,
                "player" : req.body.id
            }
            buyPlayer(object,function(result){
                models.Team.findOne({
                    "_id":teamInSession["_id"]
                },function(err,teamInSession){
                    req.session.team = teamInSession;
                    if(err){
                    res.send("Error").end();
                    return;
                    }
                    var object = {
                        res : result,
                        cash : teamInSession["cash"]
                    };
                     res.send(JSON.stringify(object)).end();
                    });
            });
            break;
        default:
            break;
    }
});
function randomizeTeam(object,callback){
      models.DefaultPlayer.find({},function(err,players){
          if(err){
              console.log(err);
              callback(false);
              return;
          }

              var cash = 13000;
              var playerList = [];
              while(playerList.length<11){
                  var random = Math.floor(Math.random()*players.length);
                  if(players[random].cost<=cash){
                        cash -= players[random].cost;
                        playerList.push(players[random]);
                  }else{
                     var popRandom = Math.floor(Math.random()*playerList.length);
                     for(var k=0;k<popRandom;k++){
                        cash+=parseInt(playerList.pop()["cost"]);
                      }
                  }
                  if(playerList.length==11){
                      var avg_batting =0;
                      var avg_bowling =0;
                      for(var l=0;l<11;l++){
                          avg_batting += parseInt(playerList[l]["battingSkill"]);
                          avg_bowling += parseInt(playerList[l]["battingSkill"]);
                      }
                      if(avg_batting/11>30&&avg_bowling/11>30){
                            var nested_callback= function(playerList){
                                if(playerList.length == 0){
                                    callback(true);
                                    return;
                                };
                                var player = playerList.pop();
                                var object = {
                                    "team" : teamInSession,
                                    "player" : player._id
                                };
                                var nest = function(noError){
                                    if(noError){
                                        nested_callback(playerList);
                                    }
                                }
                                buyPlayer(object,nest);
                                return;
                           };
                           nested_callback(playerList);
                           break;
                      }else{
                         var popRandom = Math.floor(Math.random()*playerList.length);
                         for(var k=0;k<popRandom;k++){
                            cash+=parseInt(playerList.pop()["cost"]);
                          }                            
                      }
                  }
              }
        });
}
function clearPlayers(object,callback){
    models.Player.remove({
        "team" : object.team._id,
    },function(err,players){
        if(err)
            console.log(err);
        models.Team.findOneAndUpdate({
            "_id" : object.team._id
        },{
            $set : {
                "cash" : 13000
            }
        },function(err,team){
            if(err)
                console.log(err);
                teamInSession = team;
                callback(false);
        });
    });
}
function buyPlayer(object,callback){
    var player_id = object.player;
    models.Team.findOne({
        _id : object.team._id,
    },function(err,team){
        if(err){
            console.log(err);
            callback(false);
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
                        callback(false);
                        return;
                    }
                    if(shouldBeNull!=null){
                        callback(true);
                        return;
                    }
                    if(team.cash<player.cost){
                        console.log("not enough cash");
                        callback(false);
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
                            callback(false);
                            return;
                        }
                        team.cash = parseInt(team.cash - player["cost"]);
                        team.save(function(err){
                            if(err){
                                console.log(err);
                                callback(false);
                                return;
                            }
                            callback(true);
                        });
                 });
            });
        });
    });    
}
module.exports = router;
