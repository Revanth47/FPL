var mongoose = require('mongoose');
Schema = mongoose.Schema;

var playerSchema = new Schema({
    name: String,
    id: Number,
    battingSkill : Number,
    bowlingSkill : Number,
    confidence : Number,
    team : {
        type : Schema.Types.ObjectId,
        ref : 'Team'

    },
    imgSource : String,
    misc : String
});

var teamSchema = new Schema({
    name: String,
    cash: {
        type:Number,
        default:10000
    }
});



var matchSchema = new Schema({
    teams:[{
        team: {
            type : Schema.Types.ObjectId,
            ref : 'Team'
            },
        playersStats: [{
            player:{
                type: Schema.Types.ObjectId,
                ref : 'Player'
                },
            runsScoredInMatch:{
                type:Number,
                default:0
            },
            battingStatus:{
                type:String,
                enum:["out","inStrike","notOut","notPlayed" ],
                default:"notPlayed"
            }
            ballsBowledInMatch:{
                type:Number,
                default:0
            },
            bowlingStatus:Boolean
        }],
        ballsBowled:{
            type:Number,
            default:0
        },
        runsScored:{
            type:Number,
            default:0
        }
    }],
    innings: Number,
    winner: {
        type: Schema.Types.ObjectId,
        ref:'Team'
    }
});


module.exports.Player = mongoose.model('Player',playerSchema);
module.exports.Team = mongoose.model('Team',teamSchema);
module.exports.Match = mongoose.model('Match',matchSchema);
