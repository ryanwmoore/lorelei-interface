var bodyParser = require('body-parser');
var compression = require('compression')
var cookieParser = require('cookie-parser');
var debug = require('debug')('lorelei:app');
var express = require('express');
var favicon = require('serve-favicon');
var logger = require('morgan');
var user = require('./libs/user');
var morgan = require('morgan')
var path = require('path');
var session = require('express-session');
var tournaments = require('./libs/tournaments');
var util = require('util');

var FileStore = require('session-file-store')(session);

var app = express();

app.use('/angular', express.static('./node_modules/angular/'));
app.use('/underscore', express.static('./node_modules/underscore/'));
app.use('/angular-ui-bootstrap', express.static('./node_modules/angular-ui-bootstrap/'));
app.use('/angular-animate', express.static('./node_modules/angular-animate/'));

app.use(compression())
app.use(morgan('combined'))

app.use(session({
    maxAge: 60000 * 60 * 24 * 365, //1 year (60,000 ms )
    rolling: true,
    store: new FileStore(),
    secret: 'cubchoo whatcha gonna do? evolve? lol',
    resave: false,
    saveUninitialized: true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/ids/', user);
app.use('/tournaments/', tournaments);

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
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
