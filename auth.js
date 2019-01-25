'use strict';

const session       = require('express-session');
const passport      = require('passport');
const LocalStrategy = require('passport-local');
const ObjectID      = require('mongodb').ObjectID;
const bcrypt        = require('bcrypt');

module.exports = function (app, db) {
  // Save session id as a cookie in the client and allows 
  // us to access the session data using that id on the server
  app.use(session({secret: process.env.SESSION_SECRET, resave: true, saveUninitialized: true}));

  // Passport has strategies for authenticating users
  // ex: use github to login to another site
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Serialize data into a key, which can be deserialized so user information
  // does not have to be sent for authenticatiion each time user visits a new page
  passport.serializeUser((user, done) => { done(null, user._id); });
  passport.deserializeUser((id, done) => {
    db.collection('users').findOne({_id: new ObjectID(id)},(err, doc) => {done(null, doc);});
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
          
        // Works, but does not pass fcc tests which need a synced hash process
        bcrypt.compare(password, user.password, function(err, res) {
          (res) ? done(null, user) : done(null, false)
        });
      });
    }
  ));
}