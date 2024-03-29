var passport = require('passport');
var identityhelper = require('./identityhelper');
var OpenIdConnectStrategy = require('passport-openidconnect').Strategy;

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete OIDC profile is
//   serialized and deserialized.
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

  /**
   * OpenId connect Strategy
   * @type {OpenIdConnectStrategy}
   */
var getStrategy = function (clientId, clientSecret, envir) {
  var openIdConnectStrategy = new OpenIdConnectStrategy(
    {
      issuer: process.env.OIDC_ISSUER.replace('sod', envir),
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: process.env.OIDC_CALLBACK_URL,
      authorizationURL: process.env.OIDC_AUTHORIZE_URL.replace('sod', envir),
      tokenURL: process.env.OIDC_TOKEN_URL.replace('sod', envir),
      skipUserProfile: true, // SuperOffice Online does not have a userinfo endpoint!
      scope: 'openid',
    },
    function (iss, sub, profile, jwtClaims, accessToken, refreshToken, params, cb) {
      var user = identityhelper.populateUser(accessToken, refreshToken, jwtClaims);

      //return error, user, info (for flash messages)...
      return cb(null, user, null);
    }
  );

  return openIdConnectStrategy;
};


module.exports = function (app) {
  app.use(passport.initialize());
  app.use(passport.session());

  //Logs the user out and redirects to the home page
  app.get('/logout', function (req, res) {
    req.logout();
    req.session.destroy(function () {
      res.redirect('/');
    });
  });

  // //Used to authenticate the user - you can pass a url to redirect to after authentication as the '?redirect=' param
  // app.get('/openid', function (req, res, next) {
  //   if (req.query.redirect) {
  //     req.session.authRedirect = req.query.redirect;
  //   }
    
  //   var clientId = req.body.clientId;
  //   var clientSecret = req.body.clientSecret;
    
  //   passport.authenticate('openidconnect')(req, res, next);
  // });
  
  app.post('/openid', function (req, res, next) {
    if (req.query.redirect) {
      req.session.authRedirect = req.query.redirect;
    }
    
    var clientId = req.body.clientId;
    var clientSecret = req.body.clientSecret;
    var environment = req.body.environment;
    
    req.session.oidc = { 
      env:environment,
      clientId: clientId,
      clientSecret: clientSecret
    };

    var strategy = getStrategy(clientId, clientSecret, environment);
    passport.use(strategy);

    passport.authenticate('openidconnect')(req, res, next);
  });

  // superoffice app callback/redirect_uri - this will redirect to the url saved by /openid if one exists
  app.get(
    '/openid/callback',
    function(req, res, next) {  
      if(req.query.code)
      {
          passport.authenticate('openidconnect', function(err, user, info, status) {
            if (err) { return next(err) }
            if (!user) { return res.redirect('/account/signin') }
            req.session.user = user;
            req.login(user, (err)=> {res.redirect('/account');});
          })(req, res, next);
             
      } else {
        res.redirect('/');
      }
    }
  );
};
