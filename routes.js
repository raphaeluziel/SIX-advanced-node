'use strict';

const passport      = require('passport');
const bcrypt        = require('bcrypt');

module.exports = function (app, db) { 

  // Function to prevent user from just going to profile page directly
  // without being authenticated at the login page
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  };
    
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
    // If user is not authenticated, send back home
    passport.authenticate('local', { failureRedirect: '/' }),
    // Otherwise send to their profile page
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
    // Query database for user
    db.collection('users').findOne({ username: req.body.username }, function (err, user) {
      // error querying the database
      if(err) {next(err);} 
      // user exists, go back to home page
      else if (user) {res.redirect('/');} 
      // user does not exist, add user to database
      else {
        // Generate a hash for the password
        // Method works but does not pass fcc tests since they use synced hashing
        const saltRounds = 12;
        var hash = bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
          // Store hash in database
          db.collection('users').insertOne(
          {username: req.body.username, password: hash},
          (err, doc) => {
            // If error querying database go home, otherwise go to the next step
            if(err) {res.redirect('/');}
            else {next(null, user);}
          })
        });
      }
    })},
          
          // Authenticate user and send to profile page, or 
          // if user user is not authenticated go back home
          passport.authenticate('local', { failureRedirect: '/' }),
          (req, res, next) => {res.redirect('/profile');}
          );
  
  app.route('/profile')
  // call ensureAuthenticated to make sure user is accessing profile page
  // by starting at login, and not just entering the url manually
    .get(ensureAuthenticated, (req, res) => {
    res.render(process.cwd() + '/views/pug/profile',
               // send username to profile pug
              {username: req.user.username});
    });
  
  // Handles missing pages
  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });

}