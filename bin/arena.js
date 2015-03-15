var session = require('cookie-session');
var async = require('async');
var teamSockets = {};
var onlineList = {};
var nsp;

module.exports = {
    ArenaIo : function(io){
        nsp = io.of('arena');

        nsp.on('connection',function(socket){
                var req = getCookie(socket);
                var teamId = req.session.team._id;
                if(teamId==null)
                    return;
                if(!teamSockets[teamId]){
                    teamSockets[teamId] = {};
                    teamSockets[teamId].invitedList = Array();
                }
                if(!onlineList[teamId]){
                    onlineList[teamId] = {};
                }       
                teamSockets[teamId].socket = socket;
                onlineList[teamId].team = req.session.team;
                console.log(onlineList);
                emitList(null);
                //to avoid any exploits
                var callback = function(err,matchId){
                    if(err||matchId!=null){
                        delete teamSockets[teamId];
                        delete onlineList[teamId];
                    }
                }
                socket.on('disconnect',function(){
                    delete teamSockets[teamId];
                    delete onlineList[teamId];

                    emitList(null);
                }); 
                socket.on('invite',function(otherTeamId){
                    teamSockets[teamId].invitedList.push(otherTeamId);
                    if(teamSockets[otherTeamId]){
                       if(teamSockets[otherTeamId].invitedList.indexOf(teamId)!=-1){
                            //proceed to match
                            createMatch(teamId,otherTeamId);
                            return;
                        }else{
                            sendInvite(teamId,otherTeamId);
                        }
                    }else{
                        emitList(null);
                    }
                });

        });
    }
}
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
function createMatch(teamId1,teamId2){
     var toss = Math.random();
     var temp;
     if(toss>=0.5){
         temp = teamId1;
         teamId1 = teamId2;
         teamId2 = temp;
    }
    if(teamId1==teamId2){
        return;
    }
    models.Team.findOne({
        _id:teamId1
    },function(err,team1){
        if(err||team1==null){
            console.log(err);
            return;
        }
        models.Team.findOne({
            _id:teamId2
        },function(err,team2){
            if(err||team2==null){
                console.log(err);
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
                    return;
                }
                teamSockets[teamId1].socket.emit('redirect',"yolo");
                setTimeout(function(){
                teamSockets[teamId2].socket.emit('redirect',"yolo");
                },100);
                });
        });
    });  
}
function sendInvite(inviter,invitee){
    teamSockets[invitee].socket.emit(inviter,"hello");
}
function emitList(teamId){

    if(teamId==null)
        nsp.emit('updateOnlineList',onlineList);
    else
        teamSockets[teamId].socket.emit('updateOnlineList',onlineList);
}
//to parse the cookie and get the session
function getCookie(socket){
  var cookieS = socket.request.headers.cookie;
      var req = {
          headers : {
              cookie : cookieS
            }
        };
    session({secret:'PragyanPremierLeague',name:'PragyanPremierLeague'})(req,{},function(){});
    return req;
}

