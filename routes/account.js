var express = require('express');
var router = express.Router();
var passport = require('passport');
var Auth = require('./authorization');


/* GET account page. */
router.get('/', Auth.required, function(req, res) {
    if (req.session && req.session.errors) {
        res.render('account', {
          title: "User Account",
          user: req.user,
          errors: req.session.errors
        });
    } else {
        res.render('account', {
          title: "User Account",
          user: req.user,
        });
    }
});

router.get('/signin', function(req, res) {
    res.render('login', {title: 'Login Page'});
});

router.get('/signout', function(req, res){
    res.redirect('/logout')
});

router.post('/login', function(req, res) {

    if(req.body.clientID && req.body.clientSecret) {
        setClientSettings({
            clientID: req.body.clientID,
            clientSecret: req.body.clientSecret
        
        });
    }

    passport.authenticate('openid-connect', {
        failureRedirect: '/',
        successRedirect: "/account"
    });
    res.render('account', { title: 'User Account' });
});

function setClientSettings(settings){
    if(settings && settings.clientID) {
        passport._strategies.openidconnect._clientID = settings.clientID;
    }

    if(settings && settings.clientSecret) {
        passport._strategies.openidconnect._clientSecret = settings.clientSecret;
    }
}

module.exports = router;
 