var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();

var adminRouter = require('./routes/admin');
var userRouter = require('./routes/user');

var hbs = require('express-handlebars');
var db = require('./config/connection');

var app = express(); // Do not overwrite this later!

// ✅ Redirect EC2 domain to your actual domain
app.use((req, res, next) => {
  const host = req.headers.host;
  if (host && host.includes('ec2-13-60-163-20.eu-north-1.compute.amazonaws.com')) {
    return res.redirect(301, 'https://mhvstats.xyz' + req.originalUrl);
  }
  next();
});



app.get('/robots.txt', (req, res) => {
  const host = req.headers.host;

  if (host.includes('ec2-13-60-163-20.eu-north-1.compute.amazonaws.com')) {
    res.type('text/plain');
    return res.send(`User-agent: *
Disallow: /`);
  }

  // For mhvstats.xyz (your real domain)
  res.type('text/plain');
  return res.send(`User-agent: *
Allow: /

Sitemap: https://mhvstats.xyz/sitemap.xml`);
});



// ✅ View engine setup (register first)
app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: __dirname + '/views/layout/',
  partialsDir: __dirname + '/views/partials/',
  helpers: {
    json: function (context) {
      return JSON.stringify(context);
    },
    formatDate: function (datetime) {
      if (!datetime) return "Not updated yet";
      const date = new Date(datetime);
      const options = {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit"
      };
      return date.toLocaleString("en-US", options);
    }
  }
}));

// ✅ Add this line: sets hbs as default rendering engine
app.set('view engine', 'hbs');

// ✅ And this: sets views directory
app.set('views', path.join(__dirname, 'views'));

// ✅ Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Routes
app.use('/admin', adminRouter);
app.use('/', userRouter);

// ✅ 404 handler
app.use(function (req, res, next) {
  next(createError(404));
});


// ✅ Error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// ✅ DB Connect & Server Start
db.connect((err) => {
  if (err) {
    console.error(`[${new Date().toISOString()}] ❌ DB connection error:`, err);
  } else {
    console.log(`[${new Date().toISOString()}] ✅ Database connected successfully`);

    app.listen(3001, () => {
      console.log(`[${new Date().toISOString()}] 🚀 Server started on http://localhost:3001`);
    });
  }
});

module.exports = app;

