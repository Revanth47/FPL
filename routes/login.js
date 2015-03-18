var express = require('express');
var router = express.Router();
var fs = require('fs');
var erfArr = JSON.parse(fs.readFileSync('erf.json','utf8'));
var session = require('cookie-session');
var async = require('async');
var basicAuth = require('basic-auth');
var net = require('net');


router.get(/^.*$/,function(req,res){
        if(req.session.team){
            res.redirect('/Market');
            return;
        }
        res.render('login',{
        partials : {
            layout : 'layout'
        }
    });
});
router.post('/checkLogin',function(req,res){
        var sess = req.session;
        var requestSent = false;
        var userName = req.body.rollno;
        var password = req.body.password;
        var headerSent = false;
        var timeout = setTimeout(function(){
            if(!headerSent)
                res.redirect("/login/fail");
        },20000);
        var client = net.connect({
            port : 143,
            host : '10.0.0.173'
        },function(){
            client.write('b221 LOGIN '+userName+' '+password+'\r\n');
            requestSend = true;
        });
        client.on('data',function(data){
            var result = [];
            result = data.toString().split(" ");
            var response = result[result.length-2]+" "+result[result.length-1];
            console.log(response);
            if(response == "Logged in\r\n"){
                models.Team.findOneAndUpdate({
                    name:userName
                },{},{
                    new : true,
                    upsert : true
                },function(err,teamInSession){
                    sess.team = teamInSession;
                    console.log(sess.team);
                    if(req.session.loginRedirect){
			clearTimeout(timeout);
                        res.redirect(req.session.loginRedirect);
                    }else{
			clearTimeout(timeout);
                        res.redirect("/Market");           
                    }
                });
		client.write('b222 LOGOUT\r\n');
            }
            if(response == "Authentication failed.\r\n"){
               	clearTimeout(timeout);
                res.redirect("/login/fail");              
		client.write('b222 LOGOUT\r\n');
            }
        });
        client.on('end',function(end){
        });

});
module.exports = router;
