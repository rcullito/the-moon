var express = require('express');
var path = require('path');
var fs = require('fs');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var start = require('./routes/start');
var commands = require('./routes/commands');
var report = require('./routes/report');

var app = express();

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// load once on app start. allow all routes to access room data
var rawRoomData = fs.readFileSync('public/json/rooms.json');
var rooms = JSON.parse(rawRoomData);
// this seems like best practice in express 4
app.locals.rooms = rooms;
app.locals.availableDrones = ['r2d2', 'bb8'];


// include this middleware for every subsequent route
var authenticateEmail = function (req, res, next) {
   var email = req.get('x-commander-email');
   if (!(email === 'rob.culliton@gmail.com')) {
     var invalidHeader = new Error('invalid email');
     invalidHeader.status = 400;
     return next(invalidHeader);
   }

   next();
};

app.use(authenticateEmail)
app.use('/start', start);
app.use('/', commands);
app.use('/report', report);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send({
    message: err.message,
    error: {}
  });
});


module.exports = app;
