var models = require('models');
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
        else if(match&&match.winner==null){
            callback(false,match._id);
	}
        else{
                models.Player.find({
			team : teamId
		},function(err,players){
		 	if(err){
				console.log(err);
				callback(true);
				return;
			}
			if(players.length<11){
				callback(false,null,true);
			}else{
                            callback(false,null);
                        }
		});
	}
    });
}
module.exports.checkTeamMatchStatus = checkTeamMatchStatus;
