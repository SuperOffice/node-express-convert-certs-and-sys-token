var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var moment = require('moment');
var request = require('request');
var xml2js = require('xml2js');
var jwksClient = require('jwks-rsa');
var jwt = require('jsonwebtoken');

/* GET token page. */
router.get('/', function(req, res) {
  var pem = '';
  if(req.session && req.session.pemkey)
    pem = req.session.pemkey;

  res.render('token', { 
    title: 'Exchange Token for Ticket', 
    pem: pem,
    clientSecret: process.env.OIDC_CLIENT_SECRET
  });
});

/* GET token page. */
router.post('/', function(req, res) {
  if(req.body.rsaPem)
  {
    req.session.pemkey = req.body.rsaPem;
    res.render('token', { 
      title: 'Exchange Token for Ticket', 
      pem: req.body.rsaPem
    });
  } else {
    res.end({ title: 'Exchange Token for Ticket'});
  }
});


router.post('/getSignedToken', function(req,res){
  var systemToken = req.body.systemToken;
  var rsaPrivateKey = req.body.privateKey;

  var utcTimestamp = moment.utc().format('YYYYMMDDHHmm');
  var data = `${systemToken}.${utcTimestamp}`;

  var sign = crypto.createSign('SHA256');
  sign.update(data);
  sign.end();

  sign = sign.sign(rsaPrivateKey, 'base64');
  var signedToken = `${data}.${sign}`;

  res.send({ signedToken: signedToken });
  res.end();
});

router.post('/getSystemUserTicket', function(req, res){
  var appToken = req.body.appToken;
  var contextId = req.body.customerId;
  var signedToken = req.body.signedToken;
  
  var soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
  <SOAP-ENV:Envelope xmlns:ns0="http://schemas.xmlsoap.org/soap/envelope/"
                                      xmlns:ns1="http://www.superoffice.com/superid/partnersystemuser/0.1"
                                      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                                      xmlns:tns="http://www.superoffice.com/superid/partnersystemuser/0.1"
                                      xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
      <SOAP-ENV:Header>
          <tns:ApplicationToken>${appToken}</tns:ApplicationToken>
          <tns:ContextIdentifier>${contextId}</tns:ContextIdentifier>
      </SOAP-ENV:Header>
      <ns0:Body>
          <ns1:AuthenticationRequest>
              <ns1:SignedSystemToken>${signedToken}</ns1:SignedSystemToken>
              <ns1:ReturnTokenType>Jwt</ns1:ReturnTokenType>
          </ns1:AuthenticationRequest>
      </ns0:Body>
  </SOAP-ENV:Envelope>`;

  request.post({
      url: process.env.PARTNER_SYSTEM_USER_URL,
      body: soapEnvelope,
      headers: {
        "Content-Type": "text/xml;charset=UTF-8",
        "SOAPAction": "http://www.superoffice.com/superid/partnersystemuser/0.1/IPartnerSystemUserService/Authenticate"
      }
    }, function (error, response, body) {
      console.log('\nResponse:\n' + body);
      if (!error) {
          // convert the XML response to JSON!
          JsParser(body).then(function (result) {

              var successful = result.Envelope.Body[0].AuthenticationResponse[0].IsSuccessful[0];
    
              if (successful && successful == "true") {
                  var token = result.Envelope.Body[0].AuthenticationResponse[0].Token[0];
    
                  if (token) {
                    // get public key and validate signed token.
                    validateJwtToken(token)
                    .then(validatedToken => {
                      res.render('token', {
                        title: "SuperOffice DevNet Example",
                        systemUserClaims: validatedToken
                      });      
                    })
                    .catch(error => {
                      res.render('token', {
                        title: "SuperOffice DevNet Example",
                        error: error,
                      });   
                    });                      
                  } else {
                  res.render('token', {
                      title: "SuperOffice DevNet Example",
                      errors: [{ msg: 'Web service call was successful, but unable to extract context of the JWT.' }],
                  });
                  }
              } else {
                  res.render('token', {
                  title: "SuperOffice DevNet Example",
                  errors: [{ msg: 'No ticket returned by SuperOffice. Wrong context identifier, signed key or application token?'}],
                  });
              }
          });
        
      } else {
          res.render('token', {
            title: "SuperOffice DevNet Example",
            errors: [{msg: error}],
          });
      }
  });
});

function JsParser(body) {
  return new Promise(function (resolve, reject) {
    xml2js.parseString(body, {
      tagNameProcessors: [xml2js.processors.stripPrefix]
    }, function (err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

async function validateJwtToken(token) {
  var soPublicKey = await getSigningKey();
  var validatedToken = await validateToken(token, soPublicKey);
  return validatedToken;
}

function getSigningKey() {
  return new Promise(function (resolve, reject) {
    var client = jwksClient({jwksUri:  process.env.OIDC_JWKS_URL});

    client.getSigningKey(process.env.OIDC_KID, function(err, key) {
      if(err) {
        reject(err);
      } else {
        var signingKey = key.publicKey || key.rsaPublicKey;
        resolve(signingKey);
      }
    });
  });
}

function validateToken(token, publicKey) {
  return new Promise(function(resolve, reject) {
    var options = { ignoreExpiration: true, algorithm:  ["RS256"] };

    jwt.verify(token, publicKey, options, function(err, decoded) {
      if(err) {
        reject(err);
      } else {
        console.log(JSON.stringify(decoded));
        resolve(decoded);
      }
    });
  });
}

module.exports = router;
