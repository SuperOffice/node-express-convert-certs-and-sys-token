//as default, authentication middleware does nothing
var ensureAuthenticated = function(req, res, next){
    if (req.isAuthenticated()) {
      return next();
    }
    //If the user is not already authorised, redirect them to authentication
    //return res.redirect('/openid?redirect=' + req.originalUrl);
    return res.redirect('/account/signin');
  };

const auth = {
  required: ensureAuthenticated
};

module.exports = auth;