// @ts-check
var express = require("express");
var router = express.Router();
var Auth = require("./authorization");
var send = require("../controllers/httpclient");
var identityhelper = require("../controllers/identityhelper");

/* GET account page. */
router.get("/", Auth.required, function(req, res) {
  if (req.session && req.session.errors) {
    return res.render("account", {
      title: "User Account",
      errors: req.session.errors
    });
  }
  res.render("account", {
    title: "User Account"
  });
});

router.get("/signin", function(req, res) {
  res.render("login", { title: "Login Page", isLogin: true });
});

router.get("/signout", function(req, res) {
  res.redirect("/logout");
});

router.post("/refresh", Auth.required, async function(req, res) {
  var oidcSettings = req.session.oidc;
  if (!oidcSettings) {
    return res.redirect("/account/signin");
  }
  var refresh_token = req.body.refresh_token;
  var refresh_url = `${
    process.env.OIDC_TOKEN_URL.replace("sod", oidcSettings.env)
  }?grant_type=refresh_token&client_id=${
    oidcSettings.clientId
  }&client_secret=${
    oidcSettings.clientSecret
  }&refresh_token=${refresh_token}&redirect_url=${
    process.env.OIDC_CALLBACK_URL
  }`;

  try {
    var response = await send({
      url: refresh_url,
      method: "POST",
      headers: {
        Accept: "application/json"
      }
    });
    console.log("\nResponse:\n" + response.body);
    var serverRes = JSON.parse(response.body);

    var jwtClaims = await identityhelper.validateJwtToken(
      serverRes.id_token, oidcSettings
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
});

router.post("/revoke", Auth.required, async function(req, res) {
  var refresh_token = req.body.refresh_token;
  var oidc = req.session.oidc;
  if (!oidc) {
    return res.redirect("/account/signin");
  }

  var revoke_url = `${process.env.OIDC_REVOKE_URL.replace("sod", oidc.env )}?token=${refresh_token}&token_type_hint=JWT`;

  try {
    var response = await send({
      url: revoke_url,
      method: "POST",
      headers: {
        Accept: "application/json"
      }
    });
    console.log("\nResponse:\n" + response.body);

    console.log("token revoked!");

  } catch (error) {
    console.log("Error: " + error);
  }

  res.redirect("/account");
});

module.exports = router;
