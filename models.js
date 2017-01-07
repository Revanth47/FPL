var mongoose = require('mongoose');
Schema = mongoose.Schema;

var playerSchema = new Schema({
    name: String,
    battingSkill : Number,
    bowlingSkill : Number,
    confidence : Number,
    team : {
        type : Schema.Types.ObjectId,
        ref : 'Team',
        default: null
    },
    imgSource : String,
    cost : Number,
    sold : Number
});

var teamSchema = new Schema({
    name: String,
    cash: {
        type:Number,
        default:20000
    }
});



var matchSchema = new Schema({
    team1:{
        team: {
            type : Schema.Types.ObjectId,
            ref : 'Team'
        },
        playersStats: {
            type:[{
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
                },
                ballsBowledInMatch:{
                    type:Number,
                    default:0
                },
                bowlingStatus:{
                    type:String,
                    enum:["oversDone","bowling","oversLeft"],
                    default:"oversLeft"
                }
            }],
            default:null
        },
        ballsBowled:{
            type:Number,
            default:0
        },
        runsScored:{
            type:Number,
            default:0
        }
    },
    team2:{
        team: {
            type : Schema.Types.ObjectId,
            ref : 'Team'
            },
        playersStats: {
            type:[{
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
                },
                ballsBowledInMatch:{
                    type:Number,
                    default:0
                },
                 bowlingStatus:{
                    type:String,
                    enum:["oversDone","bowling","oversLeft"],
                    default:"oversLeft"
                }
                }],
            default:null
        },
        ballsBowled:{
            type:Number,
            default:0
        },
        runsScored:{
            type:Number,
            default:0
        }
    },
    innings:{
        type:Number,
        default:1
    },
    winner: {
        type: Schema.Types.ObjectId,
        ref:'Team',
        default:null
    },
    timeOfMatch:{
        type:Date,
        default:Date.now()
    },
    matchSpecs:{
        numberOfOvers:{
            type:Number,
            default:5
        },
        bowlerOverRestriction:{
            type:Number,
            default:1
        },
        numberOfBallsInOver:{
            type:Number,
            default:6
        },
        numberOfWickets:{
            type:Number,
            default:10
        }
    },
    superOver:{
        type:Schema.Types.ObjectId,
        ref:'Match',
        default:null
    }
});


module.exports.Player = mongoose.model('Player',playerSchema);
module.exports.Team = mongoose.model('Team',teamSchema);
module.exports.Match = mongoose.model('Match',matchSchema);