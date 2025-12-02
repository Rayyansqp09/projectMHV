var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();
const NodeCache = require('node-cache');
const pageCache = new NodeCache({ stdTTL: 300 });

var db = require('./config/connection');   // ✅ ONLY ONCE — KEEP HERE

var adminRouter = require('./routes/admin');
var userRouter = require('./routes/user');

var hbs = require('express-handlebars');

var app = express();


// --------------------------------------------------
// 🔥 INITIALIZE DATABASE POOL BEFORE ROUTES
// --------------------------------------------------
db.connect((err) => {
  if (err) {
    console.error("❌ Failed to initialize DB pool:", err);
  } else {
    console.log("🔥 Database pool initialized");
  }
});

 
// --------------------------------------------------
// Redirect EC2 domain
// --------------------------------------------------
app.use((req, res, next) => {
  const host = req.headers.host;
  if (host && host.includes('ec2-13-60-163-20.eu-north-1.compute.amazonaws.com')) {
    return res.redirect(301, 'https://mhvstats.xyz' + req.originalUrl);
  }
  next();
});


// robots.txt
app.get('/robots.txt', (req, res) => {
  const host = req.headers.host;

  if (host.includes('ec2-13-60-163-20.eu-north-1.compute.amazonaws.com')) {
    res.type('text/plain');
    return res.send(`User-agent: *
Disallow: /`);
  }

  res.type('text/plain');
  return res.send(`User-agent: *
Allow: /

Sitemap: https://mhvstats.xyz/sitemap.xml`);
});


// View Engine
app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: __dirname + '/views/layout/',
  partialsDir: __dirname + '/views/partials/',
  helpers: {
    json: (context) => JSON.stringify(context),
    formatDate: (datetime) => {
      if (!datetime) return "Not updated yet";
      const date = new Date(datetime);
      return date.toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit"
      });
    },
    eq: (a, b) => a === b,
    split: (str, sep) => (!str ? [] : str.split(sep).map(s => s.trim()))
  }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// ⭐ REGISTER CUSTOM HELPER PROPERLY
const Handlebars = require('handlebars');
Handlebars.registerHelper('json', (obj) => JSON.stringify(obj));


// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Routes
app.use('/admin', adminRouter);
app.use('/', userRouter);


// 404
app.use((req, res) => {
  res.status(404);
  res.render('error', {
    title: '404 - Page Not Found | MHVStats',
    message: 'Oops! The page you are looking for does not exist.',
  });
});


// Error Handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});


// --------------------------------------------------
// Start Server
// --------------------------------------------------
app.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 Server started on port ${process.env.PORT || 3000}`);
});

module.exports = app;
