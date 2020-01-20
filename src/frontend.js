var express = require('express');
var path = require('path');
var logger = require('morgan');
var index = require('./routes/index');
var frontend = express();


// view engine setup
frontend.set('views', path.join(__dirname, 'views'));
frontend.set('view engine', 'ejs');

// set path for static assets
frontend.use(express.static(path.join(__dirname, './../public')));


// routes
frontend.use('/', index);

// catch 404 and forward to error handler
frontend.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
frontend.use(function (err, req, res, next) {
  // render the error page
  res.status(err.status || 500);
  res.render('error', { status: err.status, message: err.message });
});

module.exports = frontend;
