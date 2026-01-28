var createError = require("http-errors");
var express = require("express");
var session = require("express-session");
var MemoryStore = require("memorystore")(session);
var flash = require("express-flash");
var passport = require("passport");
var exphbs = require("express-handlebars");
//var expressValidator = require("express-validator");
var path = require("path");
var logger = require("morgan");
var cookieParser = require("cookie-parser");

require("dotenv").config();

var indexRouter = require("./routes/index");
var tokenRouter = require("./routes/token");
var accountRouter = require("./routes/account");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.engine(
  "hbs",
  exphbs({
    extname: "hbs",
    defaultLayout: "main",
    layoutsDir: __dirname + "/views/layouts/"
  })
);
app.set("view engine", "hbs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

const store = new MemoryStore({
  checkPeriod: 86400000 // prune expired entries every 24h
});

const sessionConfig = {
  secret: 'SuperOfficeDevNet',
  name: 'app.devnet',
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie : {
    sameSite: 'strict', // THIS is the config you are looing for.
  }
};

if (process.env.NODE_ENV === 'production') {
  //Tell Express that we're running behind a
  //reverse proxy that supplies https for you
  app.set('trust proxy', 1); // trust first proxy
  // enable cross-site cookie
  sessionConfig.cookie.secure = true; // serve secure cookies
  sessionConfig.cookie.sameSite = 'none'; //for an explicit cross-site cookie.
}

app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());

require("./controllers/authentication.js")(app);

app.use(flash());

// setup middleware that sets sets global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");

  if (req.isAuthenticated()) {
    res.locals.isAuthenticated = true;
    res.locals.user = req.user;
  } else {
    res.locals.isAuthenticated = false;
  }

  next();
});

app.use("/", indexRouter);
app.use("/token", tokenRouter);
app.use("/account", accountRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  console.log("Error: " + req.url);
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  console.log("Error: " + err.message);
  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

//Add middleware that will trick Express
//into thinking the request is secure
app.use(function(req, res, next) {
  if(req.headers['x-arr-ssl'] && !req.headers['x-forwarded-proto']) {
    req.headers['x-forwarded-proto'] = 'https';
  }
  return next();
});

module.exports = app;
