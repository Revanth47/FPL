var erfArr = JSON.parse(fs.readFileSync('erf.json','utf8'));
var session = require('cookie-session');
var async = require('async');
var teamSockets = {};
var nsp2,nsp;

module.exports = {
    MatchIo : function(io){
    // pre match namespace so that initialize isnt called twice if page is refreshed or navigated away from
         nsp2 = io.of('/startGame');
         nsp = io.of('/gameEngine');
         
         nsp2.on('connection',function(socket){
           var req = getCookie(socket);
           var matchId = req.session.match._id;
        //associate team with socket altogether with the match
           if(!teamSockets[matchId])
                teamSockets[matchId] = {};
            if(req.session.match.team1.team._id == req.session.team._id)
                teamSockets[matchId].team1 = socket;
            else
                teamSockets[matchId].team2 = socket;

            teamSockets[matchId].batStyle = null;
            teamSockets[matchId].ballStyle = null;
            var players = findClientsSocket(null,'/startGame');

            if(teamSockets[matchId].team1!=null&&teamSockets[matchId].team2!=null){
                var findObject={},updateObject={};
                findObject["_id"] = req.session.match._id;
                
                updateObject["team1.playersStats.0.battingStatus"] = "inStrike";
                updateObject["team1.playersStats.1.battingStatus"] = "notOut";
                updateObject["team2.playersStats.10.bowlingStatus"] = "bowling";

                updateObject["team2.playersStats.0.battingStatus"] = "inStrike";
                updateObject["team2.playersStats.1.battingStatus"] = "notOut";
                updateObject["team1.playersStats.10.bowlingStatus"] = "bowling";
                
                console.log("yolo");
                models.Match.findOneAndUpdate(findObject,{$set:updateObject},function(err,match){
                    console.log("yolo");
                    if(err||match==null){
                        console.log(err);
                        return;
                    }
                teamSockets[matchId].team1.emit('initialize',"alo");
                teamSockets[matchId].team2.emit('initialize',"alo");   
            }); 
        }
       
    });


    //-----------------------------------------------------------------------------------------------------------------------------------
    nsp.on('connection',function(socket){
        var req = getCookie(socket);
        var matchId = req.session.match._id;
        var match;
    // just in case if the socket fields change if user closes and opens the browser or some random crap
        if(!teamSockets[matchId])
            teamSockets[matchId] = {};
        if(req.session.match.team1.team._id == req.session.team._id)
            teamSockets[matchId].team1 = socket;
        else
            teamSockets[matchId].team2 = socket;
        socket.join(matchId);
        initializePlayers(matchId);

    //---------------------------------------------------
    socket.on('reorderBatsman',function(data){
        var callback = function(match){
             var teamId = req.session.team._id;
            if(!((match.team1.team._id==teamId && match.innings==1)||(match.team2.team._id==teamId && match.innings==2)))
                return;
            var team,findObject={},updateObject={};
            findObject["_id"] = match._id;
            if(match.team1.team._id == teamId)
                team = "team1";
            else
                team = "team2";
            for(var i=0;i<11;i++){
                //console.log(match[team]["playersStats"][i]["player"]+":"+data["movedId"]);
                if(match[team]["playersStats"][i]["player"]["_id"]==data["movedId"]){
                    if(match[team]["playersStats"][i]["battingStatus"]!="notPlayed"||match[team]["playersStats"][data["index"]]["battingStatus"]!="notPlayed"){
                        initializePlayers(match._id);
                        return;
                    }
                    updateObject[team+".playersStats."+i] = match[team]["playersStats"][data["index"]]; 
                    updateObject[team+".playersStats."+data["index"]] = match[team]["playersStats"][i]; 
                    models.Match.findOneAndUpdate(findObject,{$set:updateObject},function(err,match){
                            if(err||match==null){
                            console.log(err);
                            return;
                            }
                            initializePlayers(match._id);
                        });
                    break;
                }
            }
        }         
        getMatchDetails(req.session.match._id,callback);
    });
    //----------------------------------------------------
    socket.on('setBowler',function(data){
        var callback= function(match){
            var teamId = req.session.team._id;
            if(!((match.team1.team._id==teamId && match.innings==2)||(match.team2.team._id==teamId && match.innings==1)))
                return;
            var team,findObject={},updateObject={};
            if(match.team1.team._id == teamId)
                team = "team1";
            else
                team = "team2";
            findObject["_id"] = match._id;
            findObject[team+".playersStats"] = {
                $elemMatch : {
                    player : data,
                    bowlingStatus : "oversLeft"
                }
            };
            var flag = 0;
            for(var i=0;i<match[team].playersStats.length;i++){
                if(match[team].playersStats[i].bowlingStatus == "bowling"){
                    flag = flag +1;
                }
            }
            //to avoid exploit
            if(flag == 1)
                return;
            updateObject[team+".playersStats.$.bowlingStatus"] = "bowling";
            models.Match.findOneAndUpdate(findObject,{$set:updateObject},function(err,match){
                if(err||match==null){
                    console.log(err);
                    return;
                }
                initializePlayers(match._id);
         });
        };
        getMatchDetails(req.session.match._id,callback);

    });

    //----------------------------------------------------
    socket.on("setStyle",function(data){
      var callback = function(match){
            var matchId = req.session.match._id;
            if(req.session.team._id == match.team1.team._id){
                if(match.innings == 1 && teamSockets[matchId].batStyle == null)
                    teamSockets[matchId].batStyle = data;
                else if(match.innings == 2 && teamSockets[matchId].ballStyle == null)
                    teamSockets[matchId].ballStyle = data;
                else
                    return;
                }
            if(req.session.team._id == match.team2.team._id){
                if(match.innings == 2 && teamSockets[matchId].batStyle == null)
                    teamSockets[matchId].batStyle = data;
                else if(match.innings == 1 && teamSockets[req.session.match._id].ballStyle == null)
                    teamSockets[matchId].ballStyle = data;
                else
                    return;
                }
            if(teamSockets[matchId].batStyle!=null && teamSockets[matchId].ballStyle!=null){
                var batsman={},bowler={};
                var statusObject = {}
                statusObject.batStyle = teamSockets[matchId].batStyle;
                statusObject.ballStyle = teamSockets[matchId].ballStyle;
                var batTeam = "";
                var ballTeam = "";
                if(match.innings == 1){
                    batTeam = "team1";
                    ballTeam = "team2";
                }else{
                    batTeam = "team2";
                    ballTeam = "team1";
                }
                for(var i=0;i<match[batTeam].playersStats.length;i++){
                    if(match[batTeam].playersStats[i].battingStatus=="inStrike"){
                        statusObject.batsman = match[batTeam].playersStats[i].player;
                        break;
                    }
                }
                for(var i=0;i<match[ballTeam].playersStats.length;i++){
                    if(match[ballTeam].playersStats[i].bowlingStatus=="bowling"){
                        statusObject.bowler = match[ballTeam].playersStats[i].player;
                        break;
                    }
                }
                if(statusObject.batsman == "" || statusObject.bowler == "")
                    return;

                // call to gameAlgo and dealing with result
    //-----------------------------------------------------------------------------------------
              
                var result = gameEngine(statusObject);
                result.batsman.save(function(err){
                    if(err)
                    console.log(err);
                });
                result.bowler.save(function(err){
                    if(err)
                    console.log(err);
                });

    //parallel update of bat and ball stats

                async.parallel
                ([function(cb){
    // update batsman stats
                var findObject = {},updateObject={};
                findObject["_id"] = match._id;
                findObject[batTeam+".playersStats"] = {
                $elemMatch : {
                    player : result.batsman._id,
                    battingStatus:"inStrike"
                    }
                };
                if(result.result != -1){
                    var runObject = {};
                    runObject[batTeam+".playersStats.$.runsScoredInMatch"] = result.result;
                    runObject[batTeam+".runsScored"] = result.result;
                    updateObject = {
                        $inc : runObject
                    }
                    if(result.result % 2 !=0)
                            updateObject[batTeam+".playersStats.$.battingStatus"] = "notOut";
                }
                else{
                    updateObject[batTeam+".playersStats.$.battingStatus"] = "out";
                }
                models.Match.findOneAndUpdate(findObject,updateObject,function(err,match){
                        if(err||match==null){
                            console.log(err);
                            cb(true);
                            return;
                        }
                        if(result.result != -1 && result.result % 2 != 0){
                            var findObject = {},updateObject={};
                            findObject["_id"] = match._id;

                            findObject[batTeam+".playersStats"] = {
                            $elemMatch : {
                                player : {
                                    $ne : result.batsman._id
                                },
                            battingStatus:"notOut"
                            }
                            };
                            updateObject[batTeam+".playersStats.$.battingStatus"] = "inStrike";
                            models.Match.findOneAndUpdate(findObject,updateObject,function(err,match){
                                if(err||match==null){
                                    console.log(err);
                                    cb(true);
                                    return;
                                }
                                console.log("bat");
                                cb(null,true);
                            });
                        }else if(result.result == -1){
                            findObject = {},updateObject={};
                            findObject["_id"] = match._id;
                            findObject[batTeam+".playersStats"] = {
                                $elemMatch : {
                                    battingStatus:"notPlayed"
                                }
                            };
                            updateObject[batTeam+".playersStats.$.battingStatus"] = "inStrike";
                            models.Match.findOneAndUpdate(findObject,updateObject,function(err,match){
                                if(err){
                                    console.log(err);
                                    cb(true);
                                    return;
                                }
                                cb(null,true);
                            });                  
                         }
                        else{
                            console.log("bat");
                            cb(null,true);
                        }
                });
            
                },function(cb){
    //update bowler stats 
                var findObject = {};
                var updateObject = {};
                findObject["_id"] = match._id;
                findObject[ballTeam+".playersStats"] = {
                $elemMatch : {
                    player : result.bowler._id,
                    bowlingStatus: "bowling"
                    }
                };
                updateObject[ballTeam+".playersStats.$.ballsBowledInMatch"] = 1;
                updateObject[ballTeam+".ballsBowled"] = 1;
                models.Match.findOneAndUpdate(findObject,{$inc:updateObject},function(err,match){
                    if(err||match==null){
                        console.log(err);
                        cb(true);
                        return;
                    }
                    var findObject = {};
                    var updateObject = {};
                    findObject["_id"] = match._id;
                    findObject[ballTeam+".playersStats"] = {
                    $elemMatch : {
                        player : result.bowler._id,
                        bowlingStatus: "bowling",
                        ballsBowledInMatch: {
                            $mod : [match.matchSpecs.numberOfBallsInOver,0]
                            }
                         }
                    };
                    updateObject[ballTeam+".playersStats.$.bowlingStatus"] = "oversLeft";
                    models.Match.findOneAndUpdate(findObject,{$set:updateObject},function(err,match){
                        if(err){
                            console.log(err);
                            cb(true);
                            return;
                        }
                        if(match!=null){
                            var findObject = {};
                            var updateObject = {};
                            findObject["_id"] = match._id;
                            findObject[ballTeam+".playersStats"] = {
                            $elemMatch : {
                                player : result.bowler._id,
                                bowlingStatus: "bowling"
                                 }
                            };
                
                // change below to control the number of overs a bowler can bowl

                            findObject[ballTeam+".playersStats"] = {
                            $elemMatch : {
                                player : result.bowler._id,
                                ballsBowledInMatch: {
                                 $mod : [match.matchSpecs.bowlerOverRestriction*6,0]
                                 }
                            }
                            };
                            updateObject[ballTeam+".playersStats.$.bowlingStatus"] = "oversDone";
                            models.Match.findOneAndUpdate(findObject,{$set:updateObject},function(err,match){
                                if(err){
                                    console.log(err);
                                    cb(true);
                                    return;
                                }
                                console.log("ball");
                                cb(null,true);
                            });
                        }else{
                            console.log("ball");
                            cb(null,true);
                        }
                    });
                });            


                }],
                function(error,results){
                    if(error!=null)
                        return;
                var findObject = {},updateObject={};
                findObject["_id"] = match._id;
                console.log("yolo");
                
    // check of match status
                getMatchDetails(match._id,function(match){
                        var wickets=0;
                        var resultObject = {};
                        for(var i=0;i<match[batTeam].playersStats.length;i++){
                             if(match[batTeam].playersStats[i].battingStatus=="out")
                                wickets++;
                        }
                        if(wickets==match.matchSpecs.numberOfWickets){
                            if(match.innings==1){
                                resultObject['msg'] = "firstInnings";                           
                                initInnings(2,match._id);
                            }
                            else
                                resultObject['msg'] = "matchOver";
                        }
                        else if(match[ballTeam].ballsBowled==(match.matchSpecs.numberOfOvers*6)){
                            if(match.innings==1){
                                resultObject['msg'] = "firstInnings";
                                initInnings(2,match._id);
                            }
                            else
                                resultObject['msg'] = "matchOver";
                        }
                        else if(match[batTeam].runsScored>match[ballTeam].runsScored && match.innings==2){
                            resultObject['msg'] = "matchOver";
                        }
                        else{
                            resultObject['msg'] = "";
                            initializePlayers(match._id);
                        }
                        if(resultObject['msg']=="matchOver"){
                            endGame(match._id,function(){
                                emitCriticalResult(resultObject,result,matchId);
                            });
                        }else{
                            teamSockets[matchId].batStyle = null;
                            teamSockets[matchId].ballStyle = null;
                            emitCriticalResult(resultObject,result,matchId);
                        }
                    });
                });

    //            console.log(JSON.stringify(result));
            }

        };
      getMatchDetails(req.session.match._id,callback);
    });
    });
//---------------------------------------------------------------------------------------------------------
function emitCriticalResult(resultObject,result,matchId){
    resultObject['result'] = result;
        teamSockets[matchId].team1.emit('resultFromServer',resultObject);
    teamSockets[matchId].team2.emit('resultFromServer',resultObject);

}
//----------------------------------------------------------------------------------------------------------
function endGame(matchId,callback){
    models.Match.findOne({_id : matchId})
               .populate('team1.team team2.team')
               .exec(function(err,match){
                   if(err){
                       console.log(err);
                       return;
                    }
                    var winnerId;
                    if(match.team1.runsScored>match.team2.runsScored){
                        winnerId = match.team1.team._id;
                    }else if(match.team1.runsScored<match.team2.runsScored){
                        winnerId = match.team2.team._id;
                    }else if(match.team1.ballsBowled>match.team2.ballsBowled){
                        winnerId = match.team1.team._id;
                    }else if(match.team1.ballsBowled<match.team2.ballsBowled){
                        winnerId = match.team2.team._id;
                    }else{
                        var wickets1,wickets2;
                        for(var i=0;i<match["team1"].playersStats.length;i++){
                             if(match["team1"].playersStats[i].battingStatus=="out")
                                wickets1++;
                        }
                        for(var i=0;i<match["team2"].playersStats.length;i++){
                             if(match["team2"].playersStats[i].battingStatus=="out")
                                wickets2++;
                        }
                        if(wickets1<wickets2)
                            winnerId = match.team1.team._id;
                        else
                            winnerId = match.team2.team._id;
                    }
                match.winner = winnerId;
                match.save(function(err,data){
                    if(err){
                        console.log(err);
                        return;
                    }
                    callback();
                });

});
};
//-----------------------------------------------------------------------------------------------------------
function findClientsSocket(roomId, namespace) {

    var res = [], ns = io.of(namespace ||"/");    // the default namespace is "/"
    if (ns) {
        for (var id in ns.connected) {
            if(roomId) {
                var index = ns.connected[id].rooms.indexOf(roomId) ;
                if(index !== -1) {
                    res.push(ns.connected[id]);
                }
            } else {
                res.push(ns.connected[id]);
            }
        }
    }
    return res;
}
}
}
//-----------------------------------------------------------------------------------------------------------------------------------

//-----------------------------------------------------------------------------------------------------------
// to refresh the match details on the page
function initializePlayers(matchId){
var callback = function(match){

    var msg  = {
        match: match
    };
    msg.batting = (match.innings==1);
    if(teamSockets[matchId].team1)
        teamSockets[matchId].team1.emit('initialize',msg);
    msg.batting = (match.innings==2);
    if(teamSockets[matchId].team2)
        teamSockets[matchId].team2.emit('initialize',msg);
        }
getMatchDetails(matchId,callback);
}

//-----------------------------------------------------------------------------------------------------------
//gets match details,populates
function getMatchDetails(matchId,callback){
    models.Match.findOne({_id : matchId})
    .populate('team1.team team2.team team1.playersStats.player team2.playersStats.player')
    .exec(function(err,data){
        if(err){
            console.log(err);
            return;
        }
        callback(data);

                  
    });
}

//-----------------------------------------------------------------------------------------------------------
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

//-----------------------------------------------------------------------------------------------------------
// to start the innings and send message to client to redirect them to the match view from prematch view
function initInnings(inningsNumber,matchId){
        models.Match.findOneAndUpdate({_id : matchId},{$set : {innings : inningsNumber}},{new:true},function(err,match){
            if(err||match==null){
                console.log(err);
                return;
            }
            initializePlayers(match._id);

        });
}


//-----------------------------------------------------------------------------------------------------------
function gameEngine(statusObject){
    var batsman = statusObject.batsman;
    var bowler = statusObject.bowler;
    // range of 0 - 100
    var batSkill = batsman.battingSkill;
    var ballSkill = bowler.bowlingSkill;
    // alters skill from -x% to +x%
    var batConfidence = batsman.confidence;
    var ballConfidence = bowler.confidence;
    //
    //  defensive:
    //          low wicket chance, but low runs
    //  normal:
    //          none
    //  attacking:
    //          high wicket chance, but high runs
    var batStyle = statusObject.batStyle;
    var ballStyle = statusObject.ballStyle;
    // adavantageous skills
    var finalBatPoints = (batSkill+(batSkill*batConfidence/100))/100;
    var finalBallPoints = (ballSkill+(ballSkill*ballConfidence/100))/100;
    // mean computed by Skill with Confidence
    // variance computed by mean with style
    var mean = 0.5+(finalBatPoints-finalBallPoints)/2;
    var variance =  0.1;
    var varianceFactor = 0.1;
    if(batStyle=="Defend")
        variance = variance - varianceFactor*finalBatPoints/2;
    else
        variance = variance + varianceFactor*finalBatPoints/2;
    if(ballStyle=="Defend")
        variance = variance - varianceFactor*finalBallPoints/2;
    else
        variance = variance + varianceFactor*finalBallPoints/2;


    //random event
    var randomEvent = Math.random();
    //set if erf should be taken in negative, so we multiply xErf by -1,odd function
    // go to wiki and learn about gaussian probability distribution and inverse transform sampling.
    var negativeFlag = false;
    var valueOfErf = 2*randomEvent - 1;
    if(valueOfErf<0){
        valueOfErf = valueOfErf*-1;
        negativeFlag = true;
    }
    var xErf = 0.0;
    for(var i=0;i<erfArr.length;i++){
        xErf = erfArr[i].x;
        if(parseFloat(erfArr[i].y) >= valueOfErf){
            break;
        }
    }
    if(negativeFlag)
        xErf = xErf*-1;
    var randomVariable = (xErf*Math.sqrt(2*variance))+mean;



    //resultant 
    var object={};
    // u know what this is
    var confidenceFactor;
    if(randomVariable<0.14){
        object.result = -1;
        confidenceFactor = -3;
    }
    else if(randomVariable<0.50){
        object.result = 0;
        confidenceFactor = -2;
    }
    else if(randomVariable<0.60){
        object.result = 1;
        confidenceFactor = -1;
    }
    else if(randomVariable<0.65){
        object.result = 2;
        confidenceFactor = 0;
    }
    else if(randomVariable<0.75){
        object.result = 3;
        confidenceFactor = 1;
    }
    else if(randomVariable<0.85){
        object.result = 4;
        confidenceFactor = 2;
    }
    else{
        object.result = 6;
        confidenceFactor = 3;
    }
    object.batsman = batsman;
    object.bowler = bowler;
    object.batsman.confidence = batConfidence + confidenceFactor;
    if(object.batsman.confidence>25)
        object.batsman.confidence = 25;
    if(object.batsman.confidence<-25)
        object.batsman.confidence = -25;

    object.bowler.confidence = ballConfidence - confidenceFactor;
    if(object.bowler.confidence>25)
        object.bowler.confidence = 25;
    if(object.bowler.confidence<-25)
        object.bowler.confidence = -25;

   return object;
}

