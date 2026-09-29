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
   * A new instance is created per request from the settings stored in the session,
   * so that concurrent users with different client ids/environments don't collide.
   * @type {OpenIdConnectStrategy}
   */
var getStrategy = function (oidc) {
  var openIdConnectStrategy = new OpenIdConnectStrategy(
    {
      issuer: process.env.OIDC_ISSUER.replace('sod', oidc.env),
      clientID: oidc.clientId,
      clientSecret: oidc.clientSecret,
      callbackURL: process.env.OIDC_CALLBACK_URL,
      authorizationURL: process.env.OIDC_AUTHORIZE_URL.replace('sod', oidc.env),
      tokenURL: process.env.OIDC_TOKEN_URL.replace('sod', oidc.env),
      skipUserProfile: true, // SuperOffice Online does not have a userinfo endpoint!
      // 'openid' scope is added automatically by passport-openidconnect
    },
    // passport-openidconnect 0.1.x signature (arity 8)
    function (iss, profile, context, idToken, accessToken, refreshToken, params, cb) {
      // the library only decodes the id_token, so validate its signature here
      identityhelper
        .validateJwtToken(idToken, oidc)
        .then(function (jwtClaims) {
          var user = identityhelper.populateUser(accessToken, refreshToken, jwtClaims);
          return cb(null, user);
        })
        .catch(function (err) {
          return cb(err);
        });
    }
  );

  return openIdConnectStrategy;
};


module.exports = function (app) {
  //Logs the user out and redirects to the home page
  app.get('/logout', function (req, res, next) {
    req.logout(function (err) {
      if (err) { return next(err); }
      req.session.destroy(function () {
        res.redirect('/');
      });
    });
  });

  app.post('/openid', function (req, res, next) {
    if (req.query.redirect) {
      req.session.authRedirect = req.query.redirect;
    }

    req.session.oidc = {
      env: req.body.environment,
      clientId: req.body.clientId,
      clientSecret: req.body.clientSecret
    };

    passport.authenticate(getStrategy(req.session.oidc))(req, res, next);
  });

  // superoffice app callback/redirect_uri - this will redirect to the url saved by /openid if one exists
  app.get(
    '/openid/callback',
    function(req, res, next) {
      if (!req.query.code) {
        return res.redirect('/');
      }

      if (!req.session.oidc) {
        console.warn('OIDC callback without session settings - was the session cookie sent?');
        req.flash('error_msg', 'Your session expired during sign-in. Please try again.');
        return res.redirect('/account/signin');
      }

      passport.authenticate(getStrategy(req.session.oidc), function(err, user, info) {
        if (err) { return next(err); }
        if (!user) {
          console.warn('OIDC authentication failed:', info);
          req.flash('error_msg', (info && info.message) || 'Authentication failed.');
          return res.redirect('/account/signin');
        }
        // passport >= 0.6 regenerates the session on login; keep the oidc settings
        // needed by /account/refresh and /account/revoke
        req.login(user, { keepSessionInfo: true }, function (err) {
          if (err) { return next(err); }
          var redirect = req.session.authRedirect || '/account';
          delete req.session.authRedirect;
          res.redirect(redirect);
        });
      })(req, res, next);
    }
  );
};
