var express = require('express');
var router = express.Router();
var session = require('cookie-session');
router.get('/setReferral/:referralName',function(req,res){
    teamInSession = req.session.team;
    if(teamInSession.name == req.params.referralName){
        res.redirect('/bonus');
        return;
    }
    models.Team.findOneAndUpdate({
        "_id" : teamInSession._id,
        "referral":null
    },{
        $set : {
            "referral" : req.params.referralName
        }
    },function(err,team){
        if(err){
            console.log(err);
        }
        if(team!=null){
        models.Player.update({
            battingSkill : {
                $lt : 80
            },
            bowlingSkill : {
                $lt : 80
            },
            team : teamInSession._id
            },{
                $inc : {
                    battingSkill : 1,
                    bowlingSkill : 1
                }
            },{
                multi : true
            },function(err,data){
                if(err){
                    console.log(err);
                    return;
                }
                res.redirect('/bonus');
            });
        }else{
            res.redirect('/bonus');
        }
    });
});
router.get('/updateStats/:referredId',function(req,res){
    var teamInSession = req.session.team;
    if(teamInSession == null){
        res.send('Error').end();
        return;
    }
    var referredId = req.params.referredId;
    models.Team.find({
        "_id" : referredId,
        "referral" : teamInSession.name
    },function(err,team){
        if(err){
            console.log(err);
            return;
        }
        models.Match.find({
           $or:[{
                    "team1.team" : {
                        $in : team
                    }
                },{
                    "team2.team" : {
                        $in : team
                    }
                }]
        },function(err,matches){
            if(err){
                console.log(err);
                return;
            }
            if(matches.length>=3){
                models.Team.findOneAndUpdate({
                    "_id" : referredId
                },{
                    $set:{
                        "referral" : "set"
                    }
                },function(err,data){
                    if(err){
                        console.log(err);
                        return;
                    }
                });
                models.Player.update({
                    battingSkill : {
                        $lt : 80
                    },
                    bowlingSkill : {
                        $lt : 80
                    },
                    team : teamInSession._id
                },{
                    $inc : {
                        battingSkill : 1,
                        bowlingSkill : 1
                    }
                },{
                    multi : true
                },function(err,data){
                    if(err){
                        console.log(err);
                        return;
                    }
                    res.redirect('/bonus');
                });
            }
        });
    });

});
router.get('/',function(req,res){
    var teamInSession = req.session.team;
    if(teamInSession == null){
        req.session.loginRedirect = '/bonus';
        res.redirect('/login');
        return;
    }
    models.Team.find({
        "referral" : teamInSession.name
    },function(err,teams){
            if(err){
                console.log(err);
                return;
            }
            models.Match.find({
                $or:[{
                    "team1.team" : {
                        $in : teams
                    }
                },{
                    "team2.team" : {
                        $in : teams
                    }
                }]
            })
            .populate("team1.team team2.team")
            .exec(function(err,matches){
                if(err){
                    console.log(err);
                    return;
                }
                var teamList = [];
                for(var i=0;i<teams.length;i++){
                    teamList.push({
                        "id" : teams[i]._id.toString(),
                        "name" : teams[i].name.toString(),
                        "count" : 0
                    });
                    for(var j =0; j<matches.length;j++){
                        if(matches[j].team1.team._id.toString() == teams[i]._id.toString() || matches[j].team2.team._id.toString() === teams[i]._id.toString())
                            teamList[i]["count"] += 1;
                    }
                };
                    console.log(teams);
                    models.Team.findOne({
                        "_id" : teamInSession._id
                    },function(err,team){
                        if(team.referral == null)
                            bonusbox = null;
                        else
                            bonusbox = 'yes';
                    res.render('bonus',{
                        LayoutTeam : req.session.team,
                        teamsjs : JSON.stringify(teamList),
                        bonusbox : bonusbox,
                        teams : teamList,
                        partials : {
                            layout : 'layout'
                        }
                    });
                });
            });
    });
});
module.exports = router;

