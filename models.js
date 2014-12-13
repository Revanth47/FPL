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
    cash: Number,
});

module.exports.Player = mongoose.model('Player',playerSchema);
module.exports.Team = mongoose.model('Team',teamSchema);
