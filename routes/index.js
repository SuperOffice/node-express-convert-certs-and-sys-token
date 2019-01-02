var express = require('express');
var router = express.Router();
var multer = require('multer');
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });
var RSA = require('rsa-xml');

/* GET home page. */
router.get('/', function(req, res, next) {
  if (req.session && req.session.errors) {
    res.render('index', {
      title: "SuperOffice Developer Network",
      errors: req.session.errors
    });
  } else {
      res.render('index', { 
        title: 'SuperOffice Developer Network',
      });
  }
});

/* GET home page. */
router.get('/rsa', function(req, res, next) {
  if (req.session && req.session.errors) {
    res.render('rsatopem', {
      title: "Convert RSA XML to PEM",
      errors: req.session.errors
    });
  } else {
      res.render('rsatopem', { 
        title: 'Convert RSA XML to PEM',
      });
  }
});

router.post('/rsa/convertRsaToPem', function(req, res) {
  if(req.body)
  {
    var rsaXml = new RSA();
    var pem = rsaXml.exportPemKey(req.body.rsaxml);   
    res.send(JSON.stringify({ pemContent: pem }));
  } else {
    res.send('No File!')
  }
});

module.exports = router;
