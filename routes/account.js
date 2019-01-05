// @ts-check
var express = require("express");
var router = express.Router();
var passport = require("passport");
var Auth = require("./authorization");
var request = require("request");
var identityhelper = require("../controllers/identityhelper");

/* GET account page. */
router.get("/", Auth.required, function(req, res) {
  if (req.session && req.session.errors) {
    res.render("account", {
      title: "User Account",
      errors: req.session.errors
    });
  }
  res.render("account", {
    title: "User Account"
  });
});

router.get("/signin", function(req, res) {
  res.render("login", { title: "Login Page" });
});

router.get("/signout", function(req, res) {
  res.redirect("/logout");
});

router.post("/login", function(req, res) {
  // As means to eliminate hosting locally,
  // consider implementing an override to
  // hardcoded client id/secret in .env file.
  // i.e. create new strategy with new client
  // details from POST, add to passport, then
  // call authenticate using new strategy

  passport.authenticate("openid-connect", {
    failureRedirect: "/",
    successRedirect: "/account"
  });
  res.render("account", { title: "User Account" });
});

router.post("/refresh", function(req, res) {
  var refresh_token = req.body.refresh_token;
  var refresh_url = `${
    process.env.OIDC_TOKEN_URL
  }?grant_type=refresh_token&client_id=${
    process.env.OIDC_CLIENT_ID
  }&client_secret=${
    process.env.OIDC_CLIENT_SECRET
  }&refresh_token=${refresh_token}&redirect_url=${
    process.env.OIDC_CALLBACK_URL
  }`;

  request.post(
    {
      url: refresh_url,
      headers: {
        Accept: "application/json"
      }
    },
    async function(error, response, body) {
      console.log("\nResponse:\n" + body);
      var serverRes = JSON.parse(body);
      try {
        var jwtClaims = await identityhelper.validateJwtToken(
          serverRes.id_token
        );

        var user = identityhelper.populateUser(
          serverRes.access_token,
          refresh_token,
          jwtClaims
        );

        req.session.passport.user = user;
      } catch (error) {
        console.log(error);
      }
      res.redirect("/account");
    }
  );
});

module.exports = router;
