var express = require('express');
var router = express.Router();
var fs = require('fs');
var erfArr = JSON.parse(fs.readFileSync('erf.json','utf8'));
var session = require('cookie-session');
var async = require('async');
models = require('../models');
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
    if (user.name === 'auctioner' && user.pass === 'oombu') {
        return next();
    } else {
        return unauthorized(res);
    };
}
router.get('/',auth,function(req,res){
    var sess = req.session;
    if(sess.auctionCount==null)
        sess.auctionCount = 0;
    models.Player.find({
        team:null
    })
    .sort({
        imgSource : 1
    })
    .exec(function(err,players){
        if(err){
            console.log(err);
            res.send("Error").end();
            return;
        }
        models.Team.find({},function(err,teams){
            if(err){
                console.log(err);
                res.send("Error").end();
                return;
            }
            if(sess.auctionCount == players.length){
                sess.auctionCount = 0;
            }
            sess.playerOnAuction = players[sess.auctionCount];
            console.log(sess.playerOnAuction);
            res.render('auction',{
                player:players[sess.auctionCount],
                teams:teams,
                teamsjs : JSON.stringify(teams)
            });         
        });
    });
});
router.post('/',auth,function(req,res){
    function redirect(err){
        if(err){
            res.send("Error").end();
            return;
        }
        res.redirect('auction');
    }
    switch(req.body.header){
        case "buyPlayer":
            if(req.body.team==-1)
                req.session.auctionCount++;
            buyPlayer(req.body,req.session.playerOnAuction,redirect);
            break;
        default:
            break;
    }
});
router.post('/ajax',auth,function(req,res){
    switch(req.body.header){
        case "getPlayer":
            models.Player.find({
                team : req.body.team
            },function(err,data){
                if(err){
                    console.log(err);
                }
                res.send(JSON.stringify(data)).end();
            });
            break;
        default:
            break;
    }
});
function buyPlayer(object,player,callback){
    if(object.team==-1){
        callback(false);
        return;
    }
    var bid = object.money;
    object.team = JSON.parse(object.team);
    models.Team.findOne({
        _id : object.team._id,
    },function(err,team){
        if(err){
            console.log(err);
            callback(true);
            return;
        }
        if(team.cash<bid){
            console.log("not enough cash");
            callback(true);
            return;
        }
        models.Player.findOneAndUpdate({
            _id : player._id,
            team : null
        },{
            $set:{
                team:object.team._id
            }
        },function(err,data){
            if(err){
                console.log(err);
                callback(true);
                return;
            }
            team.cash = team.cash - bid;
            team.playerCount++;
            team.save(function(err){
                if(err){
                    console.log(err);
                    return;
                }

                callback(false);
            });
        });
    });    
}
module.exports = router;
