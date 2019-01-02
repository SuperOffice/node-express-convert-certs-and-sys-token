var passport = require('passport');
var OpenIdConnectStrategy = require('passport-openidconnect').Strategy;

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete OIDC profile is
//   serialized and deserialized.
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

/**
 * OpenId connect Strategy
 * @type {OpenIdConnectStrategy}
 */
var openIdConnectStrategy = new OpenIdConnectStrategy({
        issuer: 'https://sod.superoffice.com',
        clientID: process.env.OIDC_CLIENT_ID,
        clientSecret: process.env.OIDC_CLIENT_SECRET,
        callbackURL: process.env.OIDC_CALLBACK_URL,
        authorizationURL: process.env.OIDC_AUTHORIZE_URL,
        tokenURL: process.env.OIDC_TOKEN_URL,
        skipUserProfile: true, // SuperOffice Online does not have a userinfo endpoint!
        scope: 'openid'
    },
    function(iss, sub, profile, jwtClaims, accessToken, refreshToken, params, cb) {

      // Passing profile info to callback
        var info = {
          accessToken: accessToken,
          refreshToken: refreshToken,
          iat: jwtClaims.iat,
          aud: jwtClaims.aud,
          exp: jwtClaims.exp,
          nbf: jwtClaims.nbf
        };

        // if more user information is desired, i.e. first name, last name, etc
        // use the access token from above and call the web services
        var user = {
          name: sub,
          id:               jwtClaims["http://schemes.superoffice.net/identity/associateid"],
          identityProvider: jwtClaims["http://schemes.superoffice.net/identity/identityprovider"],
          email:            jwtClaims["http://schemes.superoffice.net/identity/email"],
          upn:              jwtClaims["http://schemes.superoffice.net/identity/upn"],
          ctx:              jwtClaims["http://schemes.superoffice.net/identity/ctx"],
          isAdmin:          jwtClaims["http://schemes.superoffice.net/identity/is_administrator"],
          serial:           jwtClaims["http://schemes.superoffice.net/identity/serial"],
          netserver_url:    jwtClaims["http://schemes.superoffice.net/identity/netserver_url"],
          webapi_url:       jwtClaims["http://schemes.superoffice.net/identity/webapi_url"],
          system_token:     jwtClaims["http://schemes.superoffice.net/identity/system_token"],
          info: info
        };

        //return error, user, info (for flash messages)...
        return cb(null, user, null);
    }
);

passport.use(openIdConnectStrategy);


module.exports = function(app){

  app.use(passport.initialize());
  app.use(passport.session());

  //Logs the user out and redirects to the home page
  app.get('/logout', function(req, res){
    req.logout();
    req.session.destroy(function() {
      res.redirect('/');
    });
  });

  //Used to authenticate the user - you can pass a url to redirect to after authentication as the '?redirect=' param
  app.get('/openid', function(req, res, next){
    if (req.query.redirect) {
      req.session.authRedirect = req.query.redirect;
    }
    passport.authenticate('openidconnect')(req, res, next);
  });

  //Callback url given to pingfederate team - this will redirect to the url saved by /openid if one exists
  app.get('/openid/callback',
    passport.authenticate('openidconnect', {
      failureRedirect: '/',
      successRedirect: "/account"
  }));
};
