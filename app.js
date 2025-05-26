var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var adminRouter = require('./routes/admin');
var userRouter = require('./routes/user');

var hbs = require('express-handlebars');
var db = require('./config/connection');

var app = express(); // Do not overwrite this later!

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: __dirname + '/views/layout/',
  partialsDir: __dirname + '/views/partials/',
  helpers: {
    json: function (context) {
      return JSON.stringify(context);
    }
  }
}));

// Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/admin', adminRouter);
app.use('/', userRouter);


// Catch 404
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Connect to DB and start server
db.connect((err) => {
  if (err) {
    console.log("DB connection error:", err);
  } else {
    console.log("Database connected");
    app.listen(3001, () => {
      console.log("Server running on http://localhost:3001");
    });
  }
});

module.exports = app;
