const express = require('express');
const router = express.Router();
const { base64encode, base64decode } = require('nodejs-base64');


router.get('/', function (req, res, next) {

  let os = require('os');
  let ifaces = os.networkInterfaces();
  let addresses = [];

  Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;

    ifaces[ifname].forEach(function (iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }
      addresses.push(iface.address);
      ++alias;
    });
  });


  res.render('index', { "addresses": addresses });
});

router.get('/download/:filePath', function (req, res, next) {

  let file = base64decode(req.params.filePath);
  res.download(file);


});


module.exports = router;
