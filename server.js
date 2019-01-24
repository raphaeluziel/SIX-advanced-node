'use strict';

const express       = require('express');
const bodyParser    = require('body-parser');
const session       = require('express-session');
const passport      = require('passport');
const LocalStrategy = require('passport-local');
const ObjectID      = require('mongodb').ObjectID;
const mongo         = require('mongodb').MongoClient;
const fccTesting  =   require('./freeCodeCamp/fcctesting.js');

const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));

// Body parser takes in post request and puts it into req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Save session id as a cookie in the client and allows 
// us to access the session data using that id on the server
app.use(session({secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: true}));

// Passport has strategies for authenticating users
// ex: use github to login to another site
app.use(passport.initialize());
app.use(passport.session());

// Connect database
mongo.connect(process.env.DATABASE, { useNewUrlParser: true }, (err, client) => {
  
  // This is new for mongo, so it is different in the fcc challenge
  var db = client.db('db-six');
  
  if(err) {console.log('Database error: ' + err);}
  else {
    console.log('Successful database connection');
    
    // Serialize data into a key, which can be deserialized so user information
    // does not have to be sent for authenticatiion each time user visits a new page
    passport.serializeUser((user, done) => { done(null, user._id); });
    passport.deserializeUser((id, done) => {
      db.collection('users').findOne(
        {_id: new ObjectID(id)},
        (err, doc) => {
          done(null, doc);
        }
      );
    });
    
    
    // We are using a simple strategy, but there are others, like logging in with github
    passport.use(new LocalStrategy(
      function(username, password, done) {
        // Check to see if user is in database
        db.collection('users').findOne({ username: username }, function (err, user) {
          console.log('User '+ username +' attempted to log in.');
          if (err) { return done(err); }
          // User is not in the database
          if (!user) { return done(null, false); }
          // User is in database, but provided incorrect password
          if (password !== user.password) { return done(null, false); }
          // User is validated
          return done(null, user);
        });
      }
    ));
    
    function ensureAuthenticated(req, res, next) {
      if (req.isAuthenticated()) {
        console.log("ensuring");
        return next();
        //res.redirect('/profile');
      }
      res.redirect('/');
    };
    
    // Set pug as the view engine
    app.set('view engine', 'pug');
    
    app.route('/')
      .get((req, res) => {
      // Pass the variables title, message, showLogin, etc. to the pug index file
      res.render(process.cwd() + '/views/pug/index.pug', 
                 {title: 'Home Page', 
                  message: 'Please login',
                  showLogin: true,
                  showRegistration: true
                 });
    });
    
    app.route('/login').post(
             passport.authenticate('local', { failureRedirect: '/' }),
             function(req, res) {
      res.redirect('/profile');
    });
    
    app.route('/logout')
      .get((req, res) => {
      req.logout();
      res.redirect('/');
    });
    
    app.route('/register')
  .post((req, res, next) => {
      db.collection('users').findOne({ username: req.body.username }, function (err, user) {
          if(err) {
              next(err);
          } else if (user) {
              res.redirect('/');
          } else {
              db.collection('users').insertOne(
                {username: req.body.username,
                 password: req.body.password},
                (err, doc) => {
                    if(err) {
                        res.redirect('/');
                    } else {
                        next(null, user);
                    }
                }
              )
          }
      })},
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res, next) => {
        res.redirect('/profile');
    }
);
    
    app.route('/profile')
      .get(ensureAuthenticated, (req, res) => { console.log("HEY", req.user.username);
      res.render(process.cwd() + '/views/pug/profile',
                 {username: req.user.username});
    });
    
    app.use((req, res, next) => {
      res.status(404)
        .type('text')
        .send('Not Found');
    });
   
    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });    
  }
});