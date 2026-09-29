var jwksClient = require("jwks-rsa");
var jwt = require("jsonwebtoken");

// one cached client per environment (sod, qaonline, online)
var jwksClients = {};

async function getSigningKey(oidcSettings) {
  var jwksUrl = process.env.OIDC_JWKS_URL.replace("sod", oidcSettings.env);
  var client = jwksClients[jwksUrl] || (jwksClients[jwksUrl] = jwksClient({ jwksUri: jwksUrl }));

  // jwks-rsa >= 2 is promise based - getKeys()/getSigningKeys() no longer accept callbacks
  var keys = await client.getSigningKeys();
  if (!keys.length) {
    throw new Error("No signing keys found at " + jwksUrl);
  }
  // get the first and only key
  return keys[0].getPublicKey();
}

function validateToken(token, publicKey) {
  return new Promise(function(resolve, reject) {
    var options = { ignoreExpiration: true, algorithms: ["RS256"] };

    jwt.verify(token, publicKey, options, function(err, decoded) {
      if (err) {
        reject(err);
      } else {
        console.log(JSON.stringify(decoded));
        resolve(decoded);
      }
    });
  });
}

module.exports.populateUser = function(accessToken, refreshToken, jwtClaims) {
  // Passing profile info to callback
  var info = {
    accessToken: accessToken,
    refreshToken: refreshToken,
    iat: jwtClaims.iat,
    aud: jwtClaims.aud,
    exp: jwtClaims.exp,
    nbf: jwtClaims.nbf
  };

  var user = {
    name: jwtClaims.sub,
    id: jwtClaims["http://schemes.superoffice.net/identity/associateid"],
    identityProvider:
      jwtClaims["http://schemes.superoffice.net/identity/identityprovider"],
    email: jwtClaims["http://schemes.superoffice.net/identity/email"],
    upn: jwtClaims["http://schemes.superoffice.net/identity/upn"],
    ctx: jwtClaims["http://schemes.superoffice.net/identity/ctx"],
    isAdmin:
      jwtClaims["http://schemes.superoffice.net/identity/is_administrator"],
    serial: jwtClaims["http://schemes.superoffice.net/identity/serial"],
    netserver_url:
      jwtClaims["http://schemes.superoffice.net/identity/netserver_url"],
    webapi_url: jwtClaims["http://schemes.superoffice.net/identity/webapi_url"],
    system_token:
      jwtClaims["http://schemes.superoffice.net/identity/system_token"],
    info: info
  };
  return user;
};

module.exports.validateJwtToken = async function(token, oidcSettings) {
  var soPublicKey = await getSigningKey(oidcSettings);
  var validatedToken = await validateToken(token, soPublicKey);
  return validatedToken;
};
