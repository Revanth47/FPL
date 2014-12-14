var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
fs = require('fs');
models = require('models)
mongoose.connect('mongodb://localhost:27017/PPL');
router.get('/',function(req,res){
    console.log(__dirname);
    Player.find({},function(err,players){
        res.send(players);
    });
});
module.exports = router;
